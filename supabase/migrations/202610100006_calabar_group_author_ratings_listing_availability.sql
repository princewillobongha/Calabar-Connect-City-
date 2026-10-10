-- Calabar Connect City: group-author relationship, listing availability, verification periods and profile ratings.
alter table public.community_group_posts drop constraint if exists community_group_posts_author_id_fkey;
alter table public.community_group_posts add constraint community_group_posts_author_id_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
alter table public.listings add column if not exists available_until timestamptz, add column if not exists availability_note text;
alter table public.profiles add column if not exists verified_until timestamptz, add column if not exists verified_days integer;
create table if not exists public.profile_ratings (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 rater_id uuid not null references public.profiles(id) on delete cascade,
 rating integer not null check (rating between 1 and 5),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint profile_ratings_one_rating_per_member unique(profile_id,rater_id),
 constraint profile_ratings_no_self_rating check(profile_id <> rater_id)
);
alter table public.profile_ratings enable row level security;
grant select on public.profile_ratings to anon, authenticated;
grant insert, update, delete on public.profile_ratings to authenticated;
drop policy if exists "Ratings are publicly visible" on public.profile_ratings;
create policy "Ratings are publicly visible" on public.profile_ratings for select to anon, authenticated using (true);
drop policy if exists "Members add their own ratings" on public.profile_ratings;
create policy "Members add their own ratings" on public.profile_ratings for insert to authenticated with check (rater_id = (select auth.uid()));
drop policy if exists "Members update their own ratings" on public.profile_ratings;
create policy "Members update their own ratings" on public.profile_ratings for update to authenticated using (rater_id = (select auth.uid())) with check (rater_id = (select auth.uid()));
drop policy if exists "Members remove their own ratings" on public.profile_ratings;
create policy "Members remove their own ratings" on public.profile_ratings for delete to authenticated using (rater_id = (select auth.uid()));
create index if not exists profile_ratings_profile_id_idx on public.profile_ratings(profile_id);
create index if not exists vendor_enquiries_listing_created_idx on public.vendor_enquiries(listing_id, created_at desc);
create index if not exists community_group_posts_group_created_idx on public.community_group_posts(group_id, created_at desc);
notify pgrst, 'reload schema';