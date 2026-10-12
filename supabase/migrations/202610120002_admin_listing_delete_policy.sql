-- Keep listings available until sellers mark them sold or remove them.
UPDATE public.listings SET available_until = NULL, availability_note = NULL
WHERE available_until IS NOT NULL OR availability_note IS NOT NULL;

-- Site administrator can delete any marketplace listing; sellers can delete only their own.
DROP POLICY IF EXISTS "vendor owners delete listings" ON public.listings;
DROP POLICY IF EXISTS "owners and site admin delete listings" ON public.listings;
CREATE POLICY "owners and site admin delete listings"
ON public.listings FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = listings.vendor_id AND v.owner_id = (SELECT auth.uid())
  )
  OR lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'princewillobongha@gmail.com'
);

-- Database also blocks enquiries/contact attempts against unverified sellers.
DROP POLICY IF EXISTS "signed in customers create enquiries" ON public.vendor_enquiries;
CREATE POLICY "customers create enquiries for verified sellers"
ON public.vendor_enquiries FOR INSERT TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = customer_id
  AND EXISTS (
    SELECT 1 FROM public.vendors v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = vendor_enquiries.vendor_id
      AND p.is_verified = true
      AND (p.verified_until IS NULL OR p.verified_until > now())
  )
  AND (
    vendor_enquiries.listing_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = vendor_enquiries.listing_id
        AND l.vendor_id = vendor_enquiries.vendor_id
    )
  )
);
