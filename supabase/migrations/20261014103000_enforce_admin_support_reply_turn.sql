
create index if not exists admin_support_messages_user_created_idx
  on public.admin_support_messages (user_id, created_at desc, id desc);

create or replace function public.enforce_admin_support_reply_turn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
  last_role text;
begin
  is_admin := lower(coalesce(auth.jwt()->>'email','')) = 'princewillobongha@gmail.com';

  if new.sender_id <> auth.uid() then
    raise exception 'You can only send messages from your signed-in account.';
  end if;

  if is_admin then
    if new.sender_role <> 'admin' or new.user_id = auth.uid() then
      raise exception 'Admin messages must be sent as admin to another member.';
    end if;
  else
    if new.sender_role <> 'member' or new.user_id <> auth.uid() then
      raise exception 'Members can only reply in their own private conversation.';
    end if;
  end if;

  -- Serialize messages per member so two rapid requests cannot bypass the one-reply rule.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  if not is_admin then
    select sender_role into last_role
    from public.admin_support_messages
    where user_id = new.user_id
    order by created_at desc, id desc
    limit 1;

    if last_role is distinct from 'admin' then
      raise exception 'Your message has been sent. Please wait for the admin to reply before sending another message.';
    end if;
  end if;

  if length(trim(new.message)) < 1 or length(new.message) > 4000 then
    raise exception 'Messages must contain between 1 and 4000 characters.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_admin_support_reply_turn_before_insert on public.admin_support_messages;
create trigger enforce_admin_support_reply_turn_before_insert
before insert on public.admin_support_messages
for each row execute function public.enforce_admin_support_reply_turn();

revoke all on function public.enforce_admin_support_reply_turn() from public;
