CREATE OR REPLACE FUNCTION public.require_approved_kyc_for_listing()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'Sign in and pass KYC before publishing a marketplace listing.';
  end if;
  if not exists (
    select 1 from public.kyc_submissions
    where user_id = auth.uid() and status = 'approved'
  ) then
    raise exception 'You must complete and pass KYC before publishing a marketplace listing.';
  end if;
  return new;
end;
$function$;

CREATE TRIGGER require_approved_kyc_before_listing
BEFORE INSERT ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.require_approved_kyc_for_listing();
