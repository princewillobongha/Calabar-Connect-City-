-- Admin-controlled comments for community posts; one top-level comment per member per post.
alter table public.community_posts
  add column if not exists comments_enabled boolean not null default false;

create unique index if not exists community_comments_one_top_level_per_user
  on public.community_comments(post_id, author_id)
  where parent_id is null;

drop policy if exists "Public can read community comments" on public.community_comments;
drop policy if exists "comments readable by everyone" on public.community_comments;
create policy "Comments are visible only while enabled"
  on public.community_comments for select
  using (
    exists (
      select 1 from public.community_posts p
      where p.id = community_comments.post_id
        and p.comments_enabled = true
    )
    or lower(coalesce(auth.jwt() ->> 'email', '')) = 'princewillobongha@gmail.com'
  );

drop policy if exists "Members can comment only when enabled" on public.community_comments;
create policy "Members can comment only when enabled"
  on public.community_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and parent_id is null
    and length(btrim(text)) between 1 and 1000
    and exists (
      select 1 from public.community_posts p
      where p.id = community_comments.post_id
        and p.comments_enabled = true
    )
  );

drop policy if exists "Admin can manage community comment settings" on public.community_posts;
create policy "Admin can manage community comment settings"
  on public.community_posts for update
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'princewillobongha@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'princewillobongha@gmail.com');

drop policy if exists "Admin can delete any community group" on public.community_groups;
create policy "Admin can delete any community group"
  on public.community_groups for delete
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'princewillobongha@gmail.com');

drop policy if exists "Admin can delete group memberships" on public.group_members;
create policy "Admin can delete group memberships"
  on public.group_members for delete
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'princewillobongha@gmail.com');
