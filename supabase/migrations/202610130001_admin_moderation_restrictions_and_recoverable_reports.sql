-- Safe admin moderation controls for Calabar Connect City.
-- Adds per-member posting restrictions and recoverable report deletion.
create table if not exists public.member_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restriction_type text not null check (restriction_type in ('community','groups','marketplace','all')),
  reason text not null,
  expires_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);
create index if not exists member_restrictions_active_user_idx
  on public.member_restrictions(user_id, restriction_type, expires_at)
  where deleted_at is null;
alter table public.member_restrictions enable row level security;
drop policy if exists "members can view own restrictions" on public.member_restrictions;
create policy "members can view own restrictions" on public.member_restrictions
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "admin manages member restrictions" on public.member_restrictions;
create policy "admin manages member restrictions" on public.member_restrictions
  for all to authenticated
  using (lower(coalesce((select auth.jwt()->>'email'),'')) = 'princewillobongha@gmail.com')
  with check (lower(coalesce((select auth.jwt()->>'email'),'')) = 'princewillobongha@gmail.com');

alter table public.moderation_reports
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id);

-- Replace all permissive INSERT policies on community posts so restrictions cannot
-- be bypassed through another existing policy.
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='community_posts' and cmd='INSERT'
  loop execute format('drop policy if exists %I on public.community_posts', p.policyname); end loop;
end $$;
create policy "members create community posts unless restricted" on public.community_posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (
      lower(coalesce((select auth.jwt()->>'email'),'')) = 'princewillobongha@gmail.com'
      or not exists (
        select 1 from public.member_restrictions mr
        where mr.user_id = (select auth.uid())
          and mr.deleted_at is null
          and (mr.expires_at is null or mr.expires_at > now())
          and mr.restriction_type in ('community','all')
      )
    )
  );

drop policy if exists "Members can create group posts" on public.community_group_posts;
create policy "members create group posts unless restricted" on public.community_group_posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = community_group_posts.group_id
        and gm.user_id = (select auth.uid())
        and gm.status = 'active'
    )
    and (
      lower(coalesce((select auth.jwt()->>'email'),'')) = 'princewillobongha@gmail.com'
      or not exists (
        select 1 from public.member_restrictions mr
        where mr.user_id = (select auth.uid())
          and mr.deleted_at is null
          and (mr.expires_at is null or mr.expires_at > now())
          and mr.restriction_type in ('groups','all')
      )
    )
  );

drop policy if exists "vendor owners add listings" on public.listings;
create policy "vendor owners add listings unless restricted" on public.listings
  for insert to authenticated
  with check (
    exists (select 1 from public.vendors v where v.id = listings.vendor_id and v.owner_id = (select auth.uid()))
    and (
      lower(coalesce((select auth.jwt()->>'email'),'')) = 'princewillobongha@gmail.com'
      or not exists (
        select 1 from public.member_restrictions mr
        join public.vendors v on v.owner_id = mr.user_id
        where v.id = listings.vendor_id
          and mr.deleted_at is null
          and (mr.expires_at is null or mr.expires_at > now())
          and mr.restriction_type in ('marketplace','all')
      )
    )
  );

drop policy if exists "admin can send moderation notifications" on public.notifications;
create policy "admin can send moderation notifications" on public.notifications
  for insert to authenticated
  with check (lower(coalesce((select auth.jwt()->>'email'),'')) = 'princewillobongha@gmail.com');
