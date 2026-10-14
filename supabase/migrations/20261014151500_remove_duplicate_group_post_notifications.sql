-- Keep one group-post notification trigger. The removed trigger duplicated the
-- same group_post notification for every active member of the group.
DROP TRIGGER IF EXISTS notify_group_post_after_insert ON public.community_group_posts;
