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
