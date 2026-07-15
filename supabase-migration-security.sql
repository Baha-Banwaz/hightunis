-- ============================================================
-- SECURITY MIGRATION — run this in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
--
-- Replaces the wide-open "anon can do everything" policies with:
--   * public READ of published content only
--   * public INSERT-only on inquiries (contact form) — no reads
--   * everything else admin-only via the service role (bypasses RLS)
-- Also adds indexes matching the app's query patterns.
-- ============================================================

BEGIN;

-- 1. Drop the allow-all policies
DROP POLICY IF EXISTS "Allow anon all properties"   ON public.properties;
DROP POLICY IF EXISTS "Allow anon all services"     ON public.services;
DROP POLICY IF EXISTS "Allow anon all blog_posts"   ON public.blog_posts;
DROP POLICY IF EXISTS "Allow anon all team"         ON public.team;
DROP POLICY IF EXISTS "Allow anon all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow anon all inquiries"    ON public.inquiries;

-- 2. Public may read published content only
CREATE POLICY "public_read_published_properties" ON public.properties
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "public_read_published_services" ON public.services
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "public_read_published_blog_posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "public_read_published_testimonials" ON public.testimonials
  FOR SELECT TO anon, authenticated USING (published = true);
-- team has no published flag; it is public-facing content
CREATE POLICY "public_read_team" ON public.team
  FOR SELECT TO anon, authenticated USING (true);

-- 3. Inquiries: write-only mailbox for the public.
--    No SELECT/UPDATE/DELETE policies, so customer PII is unreadable
--    with the anon key. status is pinned so it can't be spoofed.
CREATE POLICY "public_insert_inquiries" ON public.inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');

-- 4. Indexes matching actual query shapes
CREATE INDEX IF NOT EXISTS idx_properties_pub_feat_order ON public.properties (published, featured, "order");
CREATE INDEX IF NOT EXISTS idx_services_pub_order        ON public.services (published, "order");
CREATE INDEX IF NOT EXISTS idx_blog_posts_pub            ON public.blog_posts (published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_pub_created  ON public.testimonials (published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_order                ON public.team ("order");
CREATE INDEX IF NOT EXISTS idx_inquiries_status_created  ON public.inquiries (status, created_at DESC);

COMMIT;
