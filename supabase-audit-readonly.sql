-- ============================================================
-- READ-ONLY AUDIT  --  Supabase Dashboard > SQL Editor > Run
--
-- Changes nothing. Reports what the live database actually is, so we can
-- stop inferring it from the migration files in this repo.
-- Run each section and paste the output back.
-- ============================================================


-- 1. Which tables exist, and is RLS on?
--    rls_enabled = false is a full public read/write hole if anon has GRANTs.
--    rls_forced  = false means the table owner still bypasses RLS (normal).
SELECT
  c.relname                                   AS table_name,
  c.relrowsecurity                            AS rls_enabled,
  c.relforcerowsecurity                       AS rls_forced,
  (SELECT count(*) FROM pg_policies p
     WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;


-- 2. Every policy, and exactly what it allows.
--    Look for: roles containing 'anon', cmd of INSERT/UPDATE/DELETE/ALL,
--    or a qual of 'true' on a table that holds personal data.
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  permissive,
  qual        AS using_expression,
  with_check  AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;


-- 3. TABLE-level privileges held by the public roles.
--    RLS only filters ROWS. If anon holds table-wide SELECT, it can read
--    EVERY column of every row a policy lets through - this is how guest
--    columns on property_bookings became readable.
SELECT
  table_name,
  grantee,
  string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;


-- 4. COLUMN-level privileges held by the public roles.
--    Empty result = no column-level grants exist, so section 3 governs and
--    every column is reachable. After the hardening migration this should
--    list one row per column we intentionally expose.
SELECT
  table_name,
  grantee,
  privilege_type,
  string_agg(column_name, ', ' ORDER BY column_name) AS columns
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
GROUP BY table_name, grantee, privilege_type
ORDER BY table_name, grantee, privilege_type;


-- 5. Actual columns per table.
--    Compare against supabase-schema.sql to see which migrations really ran.
SELECT
  table_name,
  ordinal_position AS pos,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;


-- 6. Migration state, answered directly.
--    Each row says whether that migration's effect is present.
SELECT 'supabase-migration-bookings (inquiries.phone)' AS migration,
       to_regclass('public.inquiries') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='inquiries'
                     AND column_name='phone') AS applied
UNION ALL
SELECT 'supabase-migration-bookings (inquiries.check_in/check_out)',
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='inquiries'
                 AND column_name IN ('check_in','check_out')
               HAVING count(*) = 2)
UNION ALL
SELECT 'supabase-migration-bookings (services.image_url)',
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='services'
                 AND column_name='image_url')
UNION ALL
SELECT 'supabase-migration-bookings (property_bookings table)',
       to_regclass('public.property_bookings') IS NOT NULL
UNION ALL
SELECT 'supabase-migration-booking-guests (guest_* columns)',
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='property_bookings'
                 AND column_name IN ('guest_name','guest_email','guest_phone')
               HAVING count(*) = 3)
UNION ALL
SELECT 'supabase-migration-security (published-only read policies)',
       EXISTS (SELECT 1 FROM pg_policies
               WHERE schemaname='public'
                 AND policyname='public_read_published_properties')
UNION ALL
SELECT 'supabase-migration-security (old allow-all policies removed)',
       NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname='public'
                     AND policyname LIKE 'Allow anon all%')
UNION ALL
SELECT 'supabase-patch-created-at (testimonials.created_at)',
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='testimonials'
                 AND column_name='created_at')
UNION ALL
SELECT 'supabase-patch-created-at (team.created_at)',
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='team'
                 AND column_name='created_at')
UNION ALL
SELECT 'supabase-patch-created-at (services.created_at)',
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='services'
                 AND column_name='created_at')
UNION ALL
SELECT 'YOUR FIX: property_bookings public SELECT policy is gone',
       NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname='public' AND tablename='property_bookings'
                     AND cmd='SELECT' AND roles::text LIKE '%anon%');


-- 7. Anything in public that is NOT protected by RLS. Should return no rows.
SELECT c.relname AS unprotected_table
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false;


-- 8. Storage: is the media bucket public, and what can anon do to it?
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
