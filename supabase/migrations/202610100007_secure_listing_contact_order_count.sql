-- Count each successful Contact Seller enquiry without exposing customer identities.
alter table public.listings add column if not exists order_count integer not null default 0;
create or replace function private.increment_listing_contact_count()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.listing_id is not null then
    update public.listings set order_count = order_count + 1, updated_at = now() where id = new.listing_id;
  end if;
  return new;
end;
$$;
revoke all on function private.increment_listing_contact_count() from public, anon, authenticated;
drop trigger if exists vendor_enquiry_increment_listing_contact_count on public.vendor_enquiries;
create trigger vendor_enquiry_increment_listing_contact_count
after insert on public.vendor_enquiries
for each row execute function private.increment_listing_contact_count();
drop function if exists public.increment_listing_contact_count();
notify pgrst, 'reload schema';