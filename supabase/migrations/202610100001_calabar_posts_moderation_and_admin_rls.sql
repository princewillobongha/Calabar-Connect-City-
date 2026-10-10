create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(trim(text)) between 1 and 2000),
  category text not null default 'Community',
  created_at timestamptz not null default now()
);
alter table public.community_posts enable row level security;
drop policy if exists "community posts readable by everyone" on public.community_posts;
create policy "community posts readable by everyone" on public.community_posts for select using (true);
drop policy if exists "members create own community posts" on public.community_posts;
create policy "members create own community posts" on public.community_posts for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "authors update own community posts" on public.community_posts;
create policy "authors update own community posts" on public.community_posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists "authors delete own community posts" on public.community_posts;
create policy "authors delete own community posts" on public.community_posts for delete to authenticated using (author_id = auth.uid());

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null default 'community_content',
  target_id text,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.moderation_reports enable row level security;
drop policy if exists "members submit own moderation reports" on public.moderation_reports;
create policy "members submit own moderation reports" on public.moderation_reports for insert to authenticated with check (reporter_id = auth.uid());
drop policy if exists "members view own moderation reports" on public.moderation_reports;
create policy "members view own moderation reports" on public.moderation_reports for select to authenticated using (reporter_id = auth.uid());
drop policy if exists "designated admin manages moderation reports" on public.moderation_reports;
create policy "designated admin manages moderation reports" on public.moderation_reports for all to authenticated using (lower(coalesce(auth.jwt()->>'email','')) = 'princewillobongha@gmail.com') with check (lower(coalesce(auth.jwt()->>'email','')) = 'princewillobongha@gmail.com');

create index if not exists community_posts_created_at_idx on public.community_posts(created_at desc);
create index if not exists moderation_reports_created_at_idx on public.moderation_reports(created_at desc);
