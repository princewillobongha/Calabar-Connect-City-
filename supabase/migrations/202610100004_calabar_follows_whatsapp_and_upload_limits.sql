-- Calabar Connect City: member follows, seller WhatsApp contact, and larger image uploads.
alter table public.vendors add column if not exists whatsapp_url text;
create table if not exists public.community_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint community_follows_not_self check (follower_id <> followed_id)
);
alter table public.community_follows enable row level security;
drop policy if exists "Users can view follow relationships" on public.community_follows;
create policy "Users can view follow relationships" on public.community_follows for select to authenticated using (true);
drop policy if exists "Users can follow themselves as follower" on public.community_follows;
create policy "Users can follow themselves as follower" on public.community_follows for insert to authenticated with check (follower_id = (select auth.uid()));
drop policy if exists "Users can unfollow themselves" on public.community_follows;
create policy "Users can unfollow themselves" on public.community_follows for delete to authenticated using (follower_id = (select auth.uid()));
grant select, insert, delete on public.community_follows to authenticated;
grant select on public.community_follows to anon;
create index if not exists community_follows_followed_idx on public.community_follows(followed_id);
update storage.buckets set file_size_limit = 52428800, allowed_mime_types = null where id = 'community-media';
