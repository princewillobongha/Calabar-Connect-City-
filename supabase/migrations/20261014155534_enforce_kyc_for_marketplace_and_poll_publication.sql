-- Enforce KYC and active posting restrictions at the database boundary.
-- Frontend gates are for clear UX; these policies prevent direct API/RLS bypasses.

DROP POLICY IF EXISTS "vendor owners add listings unless restricted" ON public.listings;
CREATE POLICY "vendor owners add listings unless restricted"
ON public.listings
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = listings.vendor_id
      AND v.owner_id = (SELECT auth.uid())
  )
  AND (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'princewillobongha@gmail.com'
    OR (
      NOT EXISTS (
        SELECT 1 FROM public.member_restrictions mr
        WHERE mr.user_id = (SELECT auth.uid())
          AND mr.deleted_at IS NULL
          AND (mr.expires_at IS NULL OR mr.expires_at > now())
          AND mr.restriction_type IN ('marketplace', 'all')
      )
      AND EXISTS (
        SELECT 1 FROM public.kyc_submissions ks
        WHERE ks.user_id = (SELECT auth.uid())
          AND ks.status = 'approved'
      )
    )
  )
);

DROP POLICY IF EXISTS "Group members can create polls" ON public.community_group_polls;
CREATE POLICY "Group members can create polls"
ON public.community_group_polls
FOR INSERT TO authenticated
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
