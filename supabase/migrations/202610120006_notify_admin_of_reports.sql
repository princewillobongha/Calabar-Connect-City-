create or replace function public.notify_admin_of_report() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare admin_id uuid; reporter_name text;
begin
 select id into admin_id from auth.users where lower(email)='princewillobongha@gmail.com' limit 1;
 select coalesce(display_name,username,'A member') into reporter_name from public.profiles where id=new.reporter_id;
 if admin_id is not null then
  insert into public.notifications(user_id,actor_id,kind,title,body,target_url)
  values(admin_id,new.reporter_id,'moderation_report','New report received',coalesce(reporter_name,'A member')||' sent a report about '||coalesce(new.target_type,'content')||'.','report://'||new.id::text);
 end if;
 return new;
end $$;
drop trigger if exists notify_admin_of_report_created on public.moderation_reports;
create trigger notify_admin_of_report_created after insert on public.moderation_reports for each row execute function public.notify_admin_of_report();
revoke all on function public.notify_admin_of_report() from public,anon,authenticated;