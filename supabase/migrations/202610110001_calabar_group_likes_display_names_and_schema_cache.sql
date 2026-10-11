-- Group-post likes and repair stale PostgREST relationship metadata.
create table if not exists public.community_group_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_group_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_group_post_reactions_one_like unique(post_id,user_id)
);
alter table public.community_group_post_reactions enable row level security;
grant select on public.community_group_post_reactions to anon, authenticated;
grant insert, delete on public.community_group_post_reactions to authenticated;
drop policy if exists "Group post likes are public" on public.community_group_post_reactions;
create policy "Group post likes are public" on public.community_group_post_reactions for select to anon, authenticated using (true);
drop policy if exists "Members like group posts as themselves" on public.community_group_post_reactions;
create policy "Members like group posts as themselves" on public.community_group_post_reactions for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Members remove their own group post likes" on public.community_group_post_reactions;
create policy "Members remove their own group post likes" on public.community_group_post_reactions for delete to authenticated using (user_id = (select auth.uid()));
create index if not exists community_group_post_reactions_post_idx on public.community_group_post_reactions(post_id);
do $$
begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_group_post_reactions') then
   alter publication supabase_realtime add table public.community_group_post_reactions;
 end if;
end $$;
-- Do not display an email address's local part as a member's public display name.
update public.profiles p
set display_name = coalesce(nullif(trim(p.full_name), ''), 'Calabar Member'),
    updated_at = now()
from auth.users u
where p.id = u.id
  and lower(trim(coalesce(p.display_name, ''))) = lower(split_part(coalesce(u.email, ''), '@', 1));
notify pgrst, 'reload schema';
