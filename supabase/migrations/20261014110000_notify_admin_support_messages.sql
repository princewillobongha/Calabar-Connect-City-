create or replace function public.enforce_admin_support_reply_turn()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_admin boolean;
  latest_role text;
begin
  is_admin := lower(coalesce((select auth.jwt() ->> 'email'),'')) = 'princewillobongha@gmail.com';
  if new.sender_id is distinct from (select auth.uid()) then
    raise exception 'You can only send messages from your signed-in account.';
  end if;
  if is_admin then
    if new.sender_role <> 'admin' or new.user_id = (select auth.uid()) then
      raise exception 'Admin messages must be sent as admin to another member.';
    end if;
  else
    if new.sender_role <> 'member' or new.user_id <> (select auth.uid()) then
      raise exception 'Members can only reply in their own private conversation.';
    end if;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text,0));
  if not is_admin then
    select m.sender_role into latest_role
      from public.admin_support_messages as m
      where m.user_id = new.user_id
      order by m.created_at desc, m.id desc
      limit 1;
    if latest_role is distinct from 'admin' then
      raise exception 'Please wait for the admin to reply before sending another message.';
    end if;
  end if;
  if pg_catalog.length(pg_catalog.btrim(new.message)) < 1 or pg_catalog.length(new.message) > 4000 then
    raise exception 'Messages must contain between 1 and 4000 characters.';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_admin_support_reply_turn() from public, anon, authenticated;

drop trigger if exists admin_support_reply_turn on public.admin_support_messages;
drop trigger if exists enforce_admin_support_reply_turn_before_insert on public.admin_support_messages;
create trigger enforce_admin_support_reply_turn_before_insert
before insert on public.admin_support_messages
for each row execute function public.enforce_admin_support_reply_turn();

create or replace function public.notify_admin_support_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_user_id uuid;
begin
  if new.sender_role = 'admin' then
    insert into public.notifications (user_id, actor_id, kind, title, body, target_url)
    values (new.user_id,new.sender_id,'admin_message','A message from Calabar Connect City admin','You have a new private message from the Calabar Connect City admin.','admin-message://' || new.user_id::text);
  else
    select u.id into admin_user_id from auth.users as u where lower(u.email) = 'princewillobongha@gmail.com' limit 1;
    if admin_user_id is not null then
      insert into public.notifications (user_id, actor_id, kind, title, body, target_url)
      values (admin_user_id,new.sender_id,'admin_support_reply','A member replied to your message','A member has replied to their private admin conversation.','admin-message://' || new.user_id::text);
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.notify_admin_support_message() from public, anon, authenticated;
drop trigger if exists notify_admin_support_message on public.admin_support_messages;
create trigger notify_admin_support_message
after insert on public.admin_support_messages
for each row execute function public.notify_admin_support_message();
