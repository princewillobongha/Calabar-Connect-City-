create schema if not exists private;

create or replace function private.handle_new_calabar_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  chosen_name text;
  display_value text;
begin
  base_name := lower(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-z0-9_.]', '', 'g'));
  if length(base_name) < 3 then base_name := 'member'; end if;
  chosen_name := left(base_name, 24);
  if exists (select 1 from public.profiles p where p.username = chosen_name and p.id <> new.id) then
    chosen_name := left(base_name, 17) || '_' || left(replace(new.id::text, '-', ''), 6);
  end if;
  display_value := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(new.email, 'Calabar member'), '@', 1)
  );
  insert into public.profiles (id, username, display_name, full_name, bio, city, location, is_verified, created_at, updated_at)
  values (new.id, chosen_name, display_value, nullif(trim(new.raw_user_meta_data->>'full_name'), ''), '', 'Calabar, Cross River', 'Calabar, Cross River', false, now(), now())
  on conflict (id) do nothing;
  return new;
exception when unique_violation then
  insert into public.profiles (id, username, display_name, bio, city, location, is_verified, created_at, updated_at)
  values (new.id, left(base_name,17) || '_' || left(replace(new.id::text, '-', ''),6), display_value, '', 'Calabar, Cross River', 'Calabar, Cross River', false, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_calabar_profile() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_calabar_profile on auth.users;
create trigger on_auth_user_created_calabar_profile
after insert on auth.users
for each row execute function private.handle_new_calabar_profile();

do $$
declare
  u record;
  base_name text;
  chosen_name text;
  display_value text;
begin
  for u in select id, email, raw_user_meta_data from auth.users loop
    if not exists (select 1 from public.profiles p where p.id = u.id) then
      base_name := lower(regexp_replace(split_part(coalesce(u.email, ''), '@', 1), '[^a-z0-9_.]', '', 'g'));
      if length(base_name) < 3 then base_name := 'member'; end if;
      chosen_name := left(base_name, 24);
      if exists (select 1 from public.profiles p where p.username = chosen_name) then
        chosen_name := left(base_name, 17) || '_' || left(replace(u.id::text, '-', ''), 6);
      end if;
      display_value := coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'), ''), nullif(trim(u.raw_user_meta_data->>'full_name'), ''), split_part(coalesce(u.email, 'Calabar member'), '@', 1));
      insert into public.profiles (id, username, display_name, full_name, bio, city, location, is_verified, created_at, updated_at)
      values (u.id, chosen_name, display_value, nullif(trim(u.raw_user_meta_data->>'full_name'), ''), '', 'Calabar, Cross River', 'Calabar, Cross River', false, now(), now())
      on conflict (id) do nothing;
    end if;
  end loop;
end $$;
