create or replace function public.notify_vendor_on_enquiry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  seller_id uuid;
  listing_title text;
  customer_name text;
begin
  select v.owner_id, l.title
    into seller_id, listing_title
  from public.vendors v
  left join public.listings l on l.id = new.listing_id
  where v.id = new.vendor_id;

  if seller_id is null or seller_id = new.customer_id then
    return new;
  end if;

  select coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.username), ''), 'A Calabar Connect member')
    into customer_name
  from public.profiles p
  where p.id = new.customer_id;

  insert into public.notifications(user_id, actor_id, kind, title, body, target_url)
  values (
    seller_id,
    new.customer_id,
    'listing_enquiry',
    'Someone contacted you about a listing',
    coalesce(customer_name, 'A Calabar Connect member') || ' is interested in "' || coalesce(listing_title, 'your listing') || '". Tap to open the listing and continue the conversation on WhatsApp.',
    'listing://' || new.listing_id::text
  );

  return new;
end;
$$;

revoke execute on function public.notify_vendor_on_enquiry() from public, anon, authenticated;
drop trigger if exists vendor_enquiry_notify_seller on public.vendor_enquiries;
create trigger vendor_enquiry_notify_seller
after insert on public.vendor_enquiries
for each row execute function public.notify_vendor_on_enquiry();
