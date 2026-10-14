-- Existing reports that had already been soft-deleted are now permanently removed.
delete from public.moderation_reports where deleted_at is not null;
