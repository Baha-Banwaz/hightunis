-- ============================================================
-- COLUMN PRIVACY MIGRATION  --  Supabase Dashboard > SQL Editor
--
-- Run supabase-audit-readonly.sql FIRST and check the output. This file
-- assumes the tables and columns in supabase-schema.sql exist.
--
-- WHY THIS EXISTS
-- RLS filters ROWS, never COLUMNS. A policy of `USING (published = true)`
-- still exposes every column of every published row, because `anon` holds a
-- table-wide SELECT grant. That is how guest_name / guest_email /
-- guest_phone on property_bookings became readable with the public anon key
-- after a later migration added them to a table whose read policy said
-- "only dates are exposed here".
--
-- The durable fix is column-level GRANTs. After this runs, a column added
-- in the future is invisible to the public until someone explicitly grants
-- it - the failure mode becomes "new field does not show up on the site"
-- instead of "new field silently leaks".
--
-- The app no longer needs public write access at all: both public forms now
-- POST to /api/inquiries, which validates with zod and writes with the
-- service role. Availability is served by /api/availability, which selects
-- start_date and end_date only.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. property_bookings - confirm it is sealed.
--    You already dropped the public SELECT policy. This removes the
--    underlying grant too, so re-adding a policy by accident cannot
--    re-open it.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "public_read_property_bookings" ON public.property_bookings;
REVOKE ALL ON public.property_bookings FROM anon, authenticated;

ALTER TABLE public.property_bookings ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 2. inquiries - drop public INSERT.
--    Nothing in the browser writes to Supabase any more. The contact and
--    booking forms POST to /api/inquiries, which inserts with the service
--    role after zod validation, rate limiting and a honeypot check.
--    Removing this closes the last unauthenticated write path.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "public_insert_inquiries" ON public.inquiries;
REVOKE ALL ON public.inquiries FROM anon, authenticated;

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 3. Read-only tables: replace table-wide SELECT with column-level SELECT.
--    The column lists below are exactly what the public pages render.
--    Row filtering still comes from the existing published=true policies.
-- ------------------------------------------------------------

REVOKE ALL ON public.properties   FROM anon, authenticated;
REVOKE ALL ON public.services     FROM anon, authenticated;
REVOKE ALL ON public.blog_posts   FROM anon, authenticated;
REVOKE ALL ON public.team         FROM anon, authenticated;
REVOKE ALL ON public.testimonials FROM anon, authenticated;

GRANT SELECT (
  id, name, slug, category, location, price, description,
  image_url, gallery, amenities, featured, published, "order", created_at
) ON public.properties TO anon, authenticated;

GRANT SELECT (
  id, title, description, icon, image_url, "order", published
) ON public.services TO anon, authenticated;

GRANT SELECT (
  id, title, slug, content, cover_image, excerpt,
  published, published_at, created_at
) ON public.blog_posts TO anon, authenticated;

GRANT SELECT (
  id, name, role, photo_url, bio, "order"
) ON public.team TO anon, authenticated;

GRANT SELECT (
  id, author, role, quote, photo_url, published
) ON public.testimonials TO anon, authenticated;


-- ------------------------------------------------------------
-- 4. Make sure the read policies are present and row-correct.
--    Re-created idempotently: the repo's SQL files disagree with each other
--    about which of these exist.
-- ------------------------------------------------------------
ALTER TABLE public.properties   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

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

-- team has no published flag, so every row it holds is live the moment it is
-- created. See the OPTIONAL block at the bottom to give it a draft state.
CREATE POLICY "public_read_team" ON public.team
  FOR SELECT TO anon, authenticated USING (true);


-- ------------------------------------------------------------
-- 5. Belt and braces: nothing public may write to anything.
-- ------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

COMMIT;


-- ============================================================
-- VERIFY (run after the COMMIT above)
-- ============================================================

-- Should list column-level SELECT grants only, and no property_bookings
-- or inquiries rows at all.
SELECT table_name, grantee, privilege_type,
       string_agg(column_name, ', ' ORDER BY column_name) AS columns
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
GROUP BY table_name, grantee, privilege_type
ORDER BY table_name, grantee;

-- Should return no rows: no table-wide grants left for the public roles.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;


-- ============================================================
-- OPTIONAL - team draft state.
-- Every other content table can be worked on before it goes live; team
-- cannot. Run this if you want the same behaviour there. It defaults
-- existing rows to published so nothing disappears from the about page.
-- The about page's query would then need `.eq("published", true)` adding.
-- ============================================================
-- ALTER TABLE public.team ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true;
-- GRANT SELECT (published) ON public.team TO anon, authenticated;
-- DROP POLICY IF EXISTS "public_read_team" ON public.team;
-- CREATE POLICY "public_read_team" ON public.team
--   FOR SELECT TO anon, authenticated USING (published = true);
