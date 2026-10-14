-- Attach the existing uploaded image to this member's profile.
-- Only fills a missing avatar URL when exactly one image exists in their upload folder.
update public.profiles p
set avatar_url = 'https://moejannssmjupdvkcofw.supabase.co/storage/v1/object/public/community-media/' || o.name,
    updated_at = now()
from storage.objects o
where lower(trim(coalesce(p.username, ''))) = 'successfulng'
  and (p.avatar_url is null or trim(p.avatar_url) = '')
  and o.bucket_id = 'community-media'
  and o.name like p.id::text || '/%'
  and (select count(*) from storage.objects o2 where o2.bucket_id = 'community-media' and o2.name like p.id::text || '/%') = 1;
