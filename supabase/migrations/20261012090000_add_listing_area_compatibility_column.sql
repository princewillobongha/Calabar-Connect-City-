-- Compatibility fix for application queries that read listings.area.
-- Nullable and non-destructive: existing listing rows and relationships are preserved.
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS area text;

-- Backfill existing listings from their vendor location where available.
UPDATE public.listings AS l
SET area = COALESCE(NULLIF(v.area, ''), NULLIF(v.address, ''))
FROM public.vendors AS v
WHERE l.vendor_id = v.id AND l.area IS NULL;

NOTIFY pgrst, 'reload schema';
