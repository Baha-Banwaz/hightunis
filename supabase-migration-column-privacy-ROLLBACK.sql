-- ============================================================
-- ROLLBACK for supabase-migration-column-privacy.sql
-- Supabase Dashboard > SQL Editor > New query > paste > Run
--
-- One paste. Restores the grants and policies exactly as they were before
-- the column-privacy migration, so the site comes back if something breaks.
--
-- WHAT THIS DOES NOT RESTORE  (deliberate, permanent)
--   * public_read_property_bookings  -- the guest-PII leak. Stays dead.
--     property_bookings is re-locked at the end of this script even though
--     the blanket GRANT in section 2 would otherwise re-open it.
--
-- WHAT STAYS SAFE AFTER A ROLLBACK
--   Availability still works: /api/availability reads property_bookings with
--   the service role, which ignores grants and policies entirely. Rolling
--   back does not put guest columns back within reach of the anon key.
--
-- NO CODE CHANGES ARE NEEDED TO ROLL BACK. The app now names its columns
-- explicitly instead of using select("*"); that is a subset of what the
-- restored table-wide grants allow, so every query keeps working.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Drop the column-level SELECT grants.
--    Revoking at table level does not reliably clear separately granted
--    column privileges, so they are named here explicitly first. The
--    column lists match the migration exactly.
-- ------------------------------------------------------------
REVOKE SELECT (
  id, name, slug, category, location, price, description,
  image_url, gallery, amenities, featured, published, "order", created_at
) ON public.properties FROM anon, authenticated;

REVOKE SELECT (
  id, title, description, icon, image_url, "order", published
) ON public.services FROM anon, authenticated;

REVOKE SELECT (
  id, title, slug, content, cover_image, excerpt,
  published, published_at, created_at
) ON public.blog_posts FROM anon, authenticated;

REVOKE SELECT (
  id, name, role, photo_url, bio, "order"
) ON public.team FROM anon, authenticated;

REVOKE SELECT (
  id, author, role, quote, photo_url, published
) ON public.testimonials FROM anon, authenticated;

-- Belt and braces: clears anything the column revokes above missed.
REVOKE ALL ON public.properties   FROM anon, authenticated;
REVOKE ALL ON public.services     FROM anon, authenticated;
REVOKE ALL ON public.blog_posts   FROM anon, authenticated;
REVOKE ALL ON public.team         FROM anon, authenticated;
REVOKE ALL ON public.testimonials FROM anon, authenticated;
REVOKE ALL ON public.inquiries    FROM anon, authenticated;


-- ------------------------------------------------------------
-- 2. Restore the table-wide grants.
--    This is the stock Supabase posture the project started from: anon and
--    authenticated hold ALL on every public table, and RLS is what actually
--    restricts access. Schema-wide, mirroring the migration's schema-wide
--    REVOKE of INSERT/UPDATE/DELETE/TRUNCATE.
-- ------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;


-- ------------------------------------------------------------
-- 3. Restore the public INSERT on inquiries.
--    This is what let the old browser-side contact and booking forms write
--    directly to Supabase. status is pinned so it cannot be spoofed.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "public_insert_inquiries" ON public.inquiries;
CREATE POLICY "public_insert_inquiries" ON public.inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');


-- ------------------------------------------------------------
-- 4. Re-assert the read policies.
--    The migration re-created these unchanged, so this is a no-op in
--    practice. Included so one paste always lands in a known-good state.
-- ------------------------------------------------------------
ALTER TABLE public.properties   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_properties"   ON public.properties;
DROP POLICY IF EXISTS "public_read_published_services"     ON public.services;
DROP POLICY IF EXISTS "public_read_published_blog_posts"   ON public.blog_posts;
DROP POLICY IF EXISTS "public_read_published_testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "public_read_team"                   ON public.team;

CREATE POLICY "public_read_published_properties" ON public.properties
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "public_read_published_services" ON public.services
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "public_read_published_blog_posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "public_read_published_testimonials" ON public.testimonials
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "public_read_team" ON public.team
  FOR SELECT TO anon, authenticated USING (true);


-- ------------------------------------------------------------
-- 5. RE-LOCK property_bookings.
--    MUST run after section 2: the schema-wide GRANT ALL above would
--    otherwise hand anon its table privileges back. No SELECT policy is
--    created, so even with grants restored RLS denies by default -- this
--    removes the grants as well, so the table is closed on both layers.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "public_read_property_bookings" ON public.property_bookings;
REVOKE ALL ON public.property_bookings FROM anon, authenticated;
ALTER TABLE public.property_bookings ENABLE ROW LEVEL SECURITY;

COMMIT;


-- ============================================================
-- VERIFY (run after the COMMIT above)
-- ============================================================

-- A. Table-wide grants are back for the five content tables and inquiries,
--    and property_bookings appears NOWHERE in this result.
SELECT table_name, grantee,
       string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

-- B. Should return NO ROWS: all column-level grants are gone.
SELECT table_name, grantee, privilege_type, column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, column_name;

-- C. Policies are back, and property_bookings still has no public SELECT.
SELECT tablename, policyname, cmd, roles, qual AS using_expression,
       with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- D. THE ONE THAT MATTERS: must return NO ROWS, before and after rollback.
--    Any row here means guest PII is readable with the public anon key again.
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'property_bookings'
  AND roles::text LIKE '%anon%';
