-- Moderation conversations, member mentions, unique views and admin pinning.
alter table public.listings add column if not exists view_count bigint not null default 0;
alter table public.community_posts add column if not exists view_count bigint not null default 0, add column if not exists pinned_at timestamptz, add column if not exists mentioned_user_ids uuid[] not null default '{}';
alter table public.community_group_posts add column if not exists view_count bigint not null default 0, add column if not exists pinned_at timestamptz, add column if not exists mentioned_user_ids uuid[] not null default '{}';

create table if not exists public.report_messages(id uuid primary key default gen_random_uuid(),report_id uuid not null references public.moderation_reports(id) on delete cascade,sender_id uuid not null references auth.users(id) on delete cascade,message text not null check(length(trim(message)) between 1 and 5000),created_at timestamptz not null default now());
alter table public.report_messages enable row level security;
grant select,insert on public.report_messages to authenticated;
drop policy if exists "report participants read messages" on public.report_messages;
create policy "report participants read messages" on public.report_messages for select to authenticated using(exists(select 1 from public.moderation_reports r where r.id=report_id and (r.reporter_id=auth.uid() or lower(coalesce(auth.jwt()->>'email',''))='princewillobongha@gmail.com')));
drop policy if exists "report participants send messages" on public.report_messages;
create policy "report participants send messages" on public.report_messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.moderation_reports r where r.id=report_id and (r.reporter_id=auth.uid() or lower(coalesce(auth.jwt()->>'email',''))='princewillobongha@gmail.com')));

create table if not exists public.listing_views(listing_id uuid not null references public.listings(id) on delete cascade,viewer_id uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null default now(),primary key(listing_id,viewer_id));
create table if not exists public.community_post_views(post_id uuid not null references public.community_posts(id) on delete cascade,viewer_id uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null default now(),primary key(post_id,viewer_id));
create table if not exists public.community_group_post_views(post_id uuid not null references public.community_group_posts(id) on delete cascade,viewer_id uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null default now(),primary key(post_id,viewer_id));
alter table public.listing_views enable row level security; alter table public.community_post_views enable row level security; alter table public.community_group_post_views enable row level security;
grant select,insert on public.listing_views,public.community_post_views,public.community_group_post_views to authenticated;
drop policy if exists "members record own listing views" on public.listing_views; create policy "members record own listing views" on public.listing_views for insert to authenticated with check(viewer_id=auth.uid());
drop policy if exists "members read listing views" on public.listing_views; create policy "members read listing views" on public.listing_views for select to authenticated using(true);
drop policy if exists "members record own community post views" on public.community_post_views; create policy "members record own community post views" on public.community_post_views for insert to authenticated with check(viewer_id=auth.uid());
drop policy if exists "members read community post views" on public.community_post_views; create policy "members read community post views" on public.community_post_views for select to authenticated using(true);
drop policy if exists "members record own group post views" on public.community_group_post_views; create policy "members record own group post views" on public.community_group_post_views for insert to authenticated with check(viewer_id=auth.uid());
drop policy if exists "members read group post views" on public.community_group_post_views; create policy "members read group post views" on public.community_group_post_views for select to authenticated using(true);

create or replace function public.bump_listing_view_count() returns trigger language plpgsql set search_path=public,pg_temp as $$ begin update public.listings set view_count=view_count+1 where id=new.listing_id; return new; end $$;
create or replace function public.bump_community_post_view_count() returns trigger language plpgsql set search_path=public,pg_temp as $$ begin update public.community_posts set view_count=view_count+1 where id=new.post_id; return new; end $$;
create or replace function public.bump_group_post_view_count() returns trigger language plpgsql set search_path=public,pg_temp as $$ begin update public.community_group_posts set view_count=view_count+1 where id=new.post_id; return new; end $$;
drop trigger if exists listing_view_count_bump on public.listing_views; create trigger listing_view_count_bump after insert on public.listing_views for each row execute function public.bump_listing_view_count();
drop trigger if exists community_post_view_count_bump on public.community_post_views; create trigger community_post_view_count_bump after insert on public.community_post_views for each row execute function public.bump_community_post_view_count();
drop trigger if exists group_post_view_count_bump on public.community_group_post_views; create trigger group_post_view_count_bump after insert on public.community_group_post_views for each row execute function public.bump_group_post_view_count();

drop policy if exists "Admin can delete any community post" on public.community_posts; create policy "Admin can delete any community post" on public.community_posts for delete to authenticated using(lower(coalesce(auth.jwt()->>'email',''))='princewillobongha@gmail.com');
drop policy if exists "Admin can pin community posts" on public.community_posts; create policy "Admin can pin community posts" on public.community_posts for update to authenticated using(lower(coalesce(auth.jwt()->>'email',''))='princewillobongha@gmail.com') with check(lower(coalesce(auth.jwt()->>'email',''))='princewillobongha@gmail.com');
drop policy if exists "Admin can delete any group post" on public.community_group_posts; create policy "Admin can delete any group post" on public.community_group_posts for delete to authenticated using(lower(coalesce(auth.jwt()->>'email',''))='princewillobongha@gmail.com');
drop policy if exists "Admin can pin group posts" on public.community_group_posts; create policy "Admin can pin group posts" on public.community_group_posts for update to authenticated using(lower(coalesce(auth.jwt()->>'email',''))='princewillobongha@gmail.com') with check(lower(coalesce(auth.jwt()->>'email',''))='princewillobongha@gmail.com');

create or replace function public.notify_tagged_community_members() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare actor_name text; target_user uuid; target_url text;
begin
 select coalesce(display_name,username,'A member') into actor_name from public.profiles where id=new.author_id;
 foreach target_user in array coalesce(new.mentioned_user_ids,'{}'::uuid[]) loop
  if target_user<>new.author_id and exists(select 1 from public.profiles where id=target_user) then
   if tg_table_name='community_group_posts' then target_url:='group-post://'||new.group_id::text||'/'||new.id::text; else target_url:='post://'||new.id::text; end if;
   insert into public.notifications(user_id,actor_id,kind,title,body,target_url) values(target_user,new.author_id,'mention','You were mentioned',coalesce(actor_name,'A member')||' mentioned you in a post.',target_url);
  end if;
 end loop;
 return new;
end $$;
drop trigger if exists notify_community_post_mentions on public.community_posts; create trigger notify_community_post_mentions after insert on public.community_posts for each row execute function public.notify_tagged_community_members();
drop trigger if exists notify_group_post_mentions on public.community_group_posts; create trigger notify_group_post_mentions after insert on public.community_group_posts for each row execute function public.notify_tagged_community_members();
revoke all on function public.notify_tagged_community_members() from public,anon,authenticated;
