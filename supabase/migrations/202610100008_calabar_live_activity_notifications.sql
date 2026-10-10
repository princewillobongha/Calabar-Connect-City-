-- Real-time notifications for replies, group activity, follows and listing enquiries.
create or replace function private.notify_community_comment()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare post_author uuid;
begin
  select author_id into post_author from public.community_posts where id = new.post_id;
  if post_author is not null and post_author <> new.author_id then
    insert into public.notifications(user_id,actor_id,kind,title,body,target_url)
    values(post_author,new.author_id,'comment','New reply','Someone replied to your community post.','/community/post/'||new.post_id::text);
  end if;
  return new;
end; $$;
revoke all on function private.notify_community_comment() from public, anon, authenticated;
drop trigger if exists notify_community_comment_after_insert on public.community_comments;
create trigger notify_community_comment_after_insert after insert on public.community_comments
for each row execute function private.notify_community_comment();

create or replace function private.notify_group_post()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  insert into public.notifications(user_id,actor_id,kind,title,body,target_url)
  select gm.user_id,new.author_id,'group_post','New group post','Someone posted in a group you joined.','/groups/'||new.group_id::text
  from public.group_members gm
  where gm.group_id=new.group_id and gm.status='active' and gm.user_id<>new.author_id
  on conflict do nothing;
  return new;
end; $$;
revoke all on function private.notify_group_post() from public, anon, authenticated;
drop trigger if exists notify_group_post_after_insert on public.community_group_posts;
create trigger notify_group_post_after_insert after insert on public.community_group_posts
for each row execute function private.notify_group_post();

create or replace function private.notify_new_follow()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if new.follower_id <> new.followed_id then
    insert into public.notifications(user_id,actor_id,kind,title,body,target_url)
    values(new.followed_id,new.follower_id,'follow','New follower','Someone started following your profile.','/profile/'||new.follower_id::text);
  end if;
  return new;
end; $$;
revoke all on function private.notify_new_follow() from public, anon, authenticated;
drop trigger if exists notify_new_follow_after_insert on public.community_follows;
create trigger notify_new_follow_after_insert after insert on public.community_follows
for each row execute function private.notify_new_follow();

create or replace function private.notify_listing_enquiry()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare owner uuid;
begin
  select owner_id into owner from public.vendors where id=new.vendor_id;
  if owner is not null and owner <> new.customer_id then
    insert into public.notifications(user_id,actor_id,kind,title,body,target_url)
    values(owner,new.customer_id,'listing_enquiry','New listing enquiry','Someone contacted you about a marketplace listing.','/marketplace/listing/'||coalesce(new.listing_id::text,''));
  end if;
  return new;
end; $$;
revoke all on function private.notify_listing_enquiry() from public, anon, authenticated;
drop trigger if exists notify_listing_enquiry_after_insert on public.vendor_enquiries;
create trigger notify_listing_enquiry_after_insert after insert on public.vendor_enquiries
for each row execute function private.notify_listing_enquiry();

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
notify pgrst, 'reload schema';