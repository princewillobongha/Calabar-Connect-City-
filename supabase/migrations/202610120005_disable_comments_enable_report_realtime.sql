-- New comments are disabled; existing comments remain stored but are no longer shown in the app.
drop policy if exists "members create own comments" on public.community_comments;
revoke insert on public.community_comments from anon, authenticated;
alter table public.report_messages replica identity full;
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='report_messages') then
  alter publication supabase_realtime add table public.report_messages;
 end if;
end $$;