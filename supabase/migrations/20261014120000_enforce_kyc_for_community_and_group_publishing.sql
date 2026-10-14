ALTER POLICY "members create community posts unless restricted"
ON public.community_posts
WITH CHECK (
  author_id = (SELECT auth.uid())
  AND (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'princewillobongha@gmail.com'
    OR (
      NOT EXISTS (
        SELECT 1 FROM public.member_restrictions mr
        WHERE mr.user_id = (SELECT auth.uid())
          AND mr.deleted_at IS NULL
          AND (mr.expires_at IS NULL OR mr.expires_at > now())
          AND mr.restriction_type IN ('community', 'all')
      )
      AND EXISTS (
        SELECT 1 FROM public.kyc_submissions ks
        WHERE ks.user_id = (SELECT auth.uid())
          AND ks.status = 'approved'
      )
    )
  )
);

ALTER POLICY "members create group posts unless restricted"
ON public.community_group_posts
WITH CHECK (
  author_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = community_group_posts.group_id
      AND gm.user_id = (SELECT auth.uid())
      AND gm.status = 'active'
  )
  AND (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'princewillobongha@gmail.com'
    OR (
      NOT EXISTS (
        SELECT 1 FROM public.member_restrictions mr
        WHERE mr.user_id = (SELECT auth.uid())
          AND mr.deleted_at IS NULL
          AND (mr.expires_at IS NULL OR mr.expires_at > now())
          AND mr.restriction_type IN ('groups', 'all')
      )
      AND EXISTS (
        SELECT 1 FROM public.kyc_submissions ks
        WHERE ks.user_id = (SELECT auth.uid())
          AND ks.status = 'approved'
      )
    )
  )
);

ALTER POLICY "Group members can create polls"
ON public.community_group_polls
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = community_group_polls.group_id
      AND gm.user_id = (SELECT auth.uid())
      AND gm.status = 'active'
  )
  AND (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'princewillobongha@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.kyc_submissions ks
      WHERE ks.user_id = (SELECT auth.uid())
        AND ks.status = 'approved'
    )
  )
);
