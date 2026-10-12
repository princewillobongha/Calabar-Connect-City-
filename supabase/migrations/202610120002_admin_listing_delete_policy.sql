-- Allow the signed-in site administrator to remove any marketplace listing.
-- Vendors may still delete only their own listings. No existing records are deleted by this migration.
DROP POLICY IF EXISTS "vendor owners delete listings" ON public.listings;
CREATE POLICY "owners and site admin delete listings"
ON public.listings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.vendors v
    WHERE v.id = listings.vendor_id
      AND v.owner_id = (SELECT auth.uid())
  )
  OR lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'princewillobongha@gmail.com'
);
