-- The marketplace does not require government-ID KYC.
-- Authenticated account checks and posting restrictions remain enforced by the app/API.
DROP TRIGGER IF EXISTS require_approved_kyc_before_listing ON public.listings;
DROP FUNCTION IF EXISTS public.require_approved_kyc_for_listing();
