-- Live in-app notifications and seller enquiry counting.
-- Applied to Supabase production on 2026-10-12.

create or replace function public.notify_new_listing()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_owner uuid; v_name text;
begin
  select owner_id into v_owner from public.vendors where id = new.vendor_id;
  select coalesce(display_name, username, 'A member') into v_name from public.profiles where id = v_owner;
  insert into public.notifications (user_id, actor_id, kind, title, body, target_url)
  select p.id, v_owner, 'new_listing', 'New marketplace listing',
         coalesce(v_name, 'A member') || ' posted a new listing: ' || new.title,
         'listing://' || new.id::text
  from public.profiles p
  where p.id <> coalesce(v_owner, '00000000-0000-0000-0000-000000000000'::uuid);
  return new;
end;
$$;

create or replace function public.notify_new_community_post()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_name text;
begin
  select coalesce(display_name, username, 'A member') into v_name from public.profiles where id = new.author_id;
  insert into public.notifications (user_id, actor_id, kind, title, body, target_url)
  select p.id, new.author_id, 'community_post', 'New community post',
         coalesce(v_name, 'A member') || ' shared a new community post.',
         'post://' || new.id::text
  from public.profiles p where p.id <> new.author_id;
  return new;
end;
$$;

create or replace function public.notify_new_group_post()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_name text; v_group_name text;
begin
  select coalesce(display_name, username, 'A member') into v_name from public.profiles where id = new.author_id;
  select name into v_group_name from public.community_groups where id = new.group_id;
  insert into public.notifications (user_id, actor_id, kind, title, body, target_url)
  select gm.user_id, new.author_id, 'group_post', 'New post in ' || coalesce(v_group_name, 'your group'),
         coalesce(v_name, 'A member') || ' posted in ' || coalesce(v_group_name, 'your group') || '.',
         'group-post://' || new.group_id::text || '/' || new.id::text
  from public.group_members gm
  where gm.group_id = new.group_id and gm.status = 'active' and gm.user_id <> new.author_id;
  return new;
end;
$$;

create or replace function public.notify_new_follower()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_name text;
begin
  select coalesce(display_name, username, 'A member') into v_name from public.profiles where id = new.follower_id;
  insert into public.notifications (user_id, actor_id, kind, title, body, target_url)
  values (new.followed_id, new.follower_id, 'new_follower', 'You have a new follower',
          coalesce(v_name, 'A member') || ' started following you.',
          'profile://' || new.follower_id::text);
  return new;
end;
$$;

create or replace function public.increment_listing_enquiry_count()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if new.listing_id is not null then
    update public.listings set order_count = order_count + 1 where id = new.listing_id;
  end if;
  return new;
end;
$$;

drop trigger if exists notify_listing_created on public.listings;
create trigger notify_listing_created after insert on public.listings for each row execute function public.notify_new_listing();
drop trigger if exists notify_community_post_created on public.community_posts;
create trigger notify_community_post_created after insert on public.community_posts for each row execute function public.notify_new_community_post();
drop trigger if exists notify_group_post_created on public.community_group_posts;
create trigger notify_group_post_created after insert on public.community_group_posts for each row execute function public.notify_new_group_post();
drop trigger if exists notify_follower_created on public.community_follows;
create trigger notify_follower_created after insert on public.community_follows for each row execute function public.notify_new_follower();
drop trigger if exists increment_listing_enquiries on public.vendor_enquiries;
create trigger increment_listing_enquiries after insert on public.vendor_enquiries for each row execute function public.increment_listing_enquiry_count();

revoke all on function public.notify_new_listing() from public;
revoke all on function public.notify_new_community_post() from public;
revoke all on function public.notify_new_group_post() from public;
revoke all on function public.notify_new_follower() from public;
revoke all on function public.increment_listing_enquiry_count() from public;
revoke all on function public.notify_new_listing() from anon, authenticated;
revoke all on function public.notify_new_community_post() from anon, authenticated;
revoke all on function public.notify_new_group_post() from anon, authenticated;
revoke all on function public.notify_new_follower() from anon, authenticated;
revoke all on function public.increment_listing_enquiry_count() from anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
