create or replace function public.notify_direct_message()
returns trigger language plpgsql security definer set search_path = public
as $$
declare recipient uuid;
begin
  if new.conversation_id is null then return new; end if;
  select case when c.user_a = new.sender_id then c.user_b else c.user_a end
    into recipient from public.conversations c where c.id = new.conversation_id;
  if recipient is not null then
    insert into public.notifications(user_id, actor_id, kind, title, body)
    values (recipient, new.sender_id, 'message', 'New message', 'You received a new community message.');
  end if;
  return new;
end;
$$;
drop trigger if exists on_direct_message_notification on public.messages;
create trigger on_direct_message_notification after insert on public.messages
for each row execute function public.notify_direct_message();

create or replace function public.notify_friend_request()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications(user_id, actor_id, kind, title, body)
  values (new.receiver_id, new.sender_id, 'friend_request', 'Connection request', 'Someone wants to connect with you.');
  return new;
end;
$$;
drop trigger if exists on_friend_request_notification on public.friend_requests;
create trigger on_friend_request_notification after insert on public.friend_requests
for each row execute function public.notify_friend_request();

create index if not exists community_groups_owner_idx on public.community_groups(owner_id);
create index if not exists conversations_user_a_idx on public.conversations(user_a);
create index if not exists conversations_user_b_idx on public.conversations(user_b);
create index if not exists friend_requests_receiver_idx on public.friend_requests(receiver_id);
create index if not exists friendships_user_b_idx on public.friendships(user_b);
create index if not exists group_members_user_idx on public.group_members(user_id);
create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists moderation_reports_reporter_idx on public.moderation_reports(reporter_id);
create index if not exists notifications_actor_idx on public.notifications(actor_id);
create index if not exists reviews_author_idx on public.reviews(author_id);
create index if not exists saved_listings_listing_idx on public.saved_listings(listing_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);
create index if not exists vendor_enquiries_customer_idx on public.vendor_enquiries(customer_id);
create index if not exists vendor_enquiries_listing_idx on public.vendor_enquiries(listing_id);
create index if not exists vendor_enquiries_vendor_idx on public.vendor_enquiries(vendor_id);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then alter publication supabase_realtime add table public.messages; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then alter publication supabase_realtime add table public.notifications; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_posts') then alter publication supabase_realtime add table public.community_posts; end if;
end $$;
