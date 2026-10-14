-- Temporary rollback used during investigation; followed by the restoration migration.
-- Keep both entries so the repository migration history matches the linked Supabase project.
DROP TRIGGER IF EXISTS require_approved_kyc_before_listing ON public.listings;
DROP FUNCTION IF EXISTS public.require_approved_kyc_for_listing();
