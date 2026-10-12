-- Keep moderation report states compatible with existing clients that use pending.
alter table public.moderation_reports
  drop constraint if exists moderation_reports_status_check;

alter table public.moderation_reports
  add constraint moderation_reports_status_check
  check (status = any (array[
    'open'::text,
    'pending'::text,
    'reviewing'::text,
    'resolved'::text,
    'dismissed'::text
  ]));

notify pgrst, 'reload schema';
