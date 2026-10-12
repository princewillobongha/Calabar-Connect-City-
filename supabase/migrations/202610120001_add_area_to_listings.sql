-- Keep the listings schema aligned with the marketplace's area/location field.
-- Nullable and non-destructive: existing listings and community data are preserved.
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS area text;
