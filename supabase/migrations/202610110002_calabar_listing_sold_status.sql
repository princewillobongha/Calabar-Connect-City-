alter table public.listings
  add column if not exists sale_status text not null default 'available';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.listings'::regclass
      and conname = 'listings_sale_status_check'
  ) then
    alter table public.listings
      add constraint listings_sale_status_check
      check (sale_status in ('available', 'sold'));
  end if;
end $$;

create index if not exists listings_sale_status_available_until_idx
  on public.listings (sale_status, available_until);

notify pgrst, 'reload schema';
