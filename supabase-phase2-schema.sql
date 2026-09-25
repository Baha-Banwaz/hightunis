-- ============================================================
-- PHASE 2 SCHEMA  --  Supabase Dashboard > SQL Editor
--
-- RUN ORDER
--   1. supabase-migration-column-privacy.sql   (column-level grants)
--   2. supabase-phase2-overlap-precheck.sql    (read-only; gates section 6)
--   3. THIS FILE
--
-- ############################################################
-- #  PRIVACY RULES FOR EVERYTHING BELOW - READ BEFORE EDITING #
-- ############################################################
--
--   amount_cents, currency, confirmed_at, cancelled_at
--       MONEY AND INTERNAL TIMESTAMPS. NEVER granted to anon or
--       authenticated. They are read by /api/admin/* with the service
--       role, which ignores grants entirely. There is no public page
--       that needs them and there never should be.
--
--   inquiry_status_events
--       INTERNAL AUDIT LOG. RLS on, zero anon grants, no policies.
--       Do not add a public read policy. Ever.
--
--   WHY THE EXPLICIT REVOKE BELOW IS NOT OPTIONAL:
--       Supabase ships with
--         ALTER DEFAULT PRIVILEGES IN SCHEMA public
--           GRANT ALL ON TABLES TO anon, authenticated, ...
--       so a NEWLY CREATED TABLE is granted to anon the moment it exists.
--       RLS with no policy still blocks the rows, but the grant sits
--       there waiting for someone to add a policy "just for the admin".
--       Also: column-privacy's REVOKE ... ON ALL TABLES was a one-time
--       statement and does not cover tables created afterwards.
--
--   If you are ever tempted to GRANT on either of these, the answer is no.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Status: add 'cancelled', and constrain the column.
--    VERIFIED SAFE: the live table holds only {new: 1, booked: 6} and has
--    no existing CHECK constraint, so nothing can violate this.
-- ------------------------------------------------------------
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_status_check
  CHECK (status IN ('new','contacted','booked','cancelled','finished'));


-- ------------------------------------------------------------
-- 2. Commercial columns on inquiries.
--    On inquiries, NOT property_bookings: syncBookingForInquiry deletes
--    and re-inserts the booking row on every inquiry edit, so anything
--    stored there is destroyed the next time someone fixes a phone number.
--
--    amount_cents is integer, capping at EUR 21,474,836. Ample for a stay.
--    Switch to bigint if you ever record a property sale here.
-- ------------------------------------------------------------
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS amount_cents integer;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS currency     text NOT NULL DEFAULT 'EUR';
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_amount_nonneg;
ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_amount_nonneg
  CHECK (amount_cents IS NULL OR amount_cents >= 0);

COMMENT ON COLUMN public.inquiries.amount_cents IS
  'Booking value in minor units. PRIVATE - never grant to anon.';
COMMENT ON COLUMN public.inquiries.confirmed_at IS
  'First time status became booked; never overwritten. Dates "booked revenue". PRIVATE.';
COMMENT ON COLUMN public.inquiries.cancelled_at IS
  'When the booking was cancelled. PRIVATE.';

-- Backfill confirmed_at for the rows already booked, so the dashboard is not
-- blank for existing data. created_at is the closest honest approximation we
-- have; property_bookings.created_at is NOT usable (it is rewritten on every
-- inquiry edit - see guest "bHAa": inquiry 2026-07-15, block 2026-09-19).
UPDATE public.inquiries
   SET confirmed_at = created_at
 WHERE status = 'booked' AND confirmed_at IS NULL;

-- NOTE: no GRANT statements for these columns. That is deliberate.


-- ------------------------------------------------------------
-- 3. Status audit log. Every transition, manual or automatic.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiry_status_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id  uuid NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  -- 'admin' for a person, 'system:auto-finish' for the cron.
  actor       text NOT NULL,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.inquiry_status_events IS
  'Internal audit log. PRIVATE - RLS on, no policies, no anon grants.';

-- Sealed on both layers: RLS blocks the rows, the revoke removes the
-- default grant Supabase hands every new table.
ALTER TABLE public.inquiry_status_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inquiry_status_events FROM anon, authenticated;
-- No CREATE POLICY. The service role bypasses RLS; nothing else may read this.


-- ------------------------------------------------------------
-- 4. Indexes. The live inquiries table had ONLY its primary key.
--    Negligible at 7 rows; correct as the table grows.
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_inquiries_created        ON public.inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status_created ON public.inquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_property       ON public.inquiries (property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_check_out      ON public.inquiries (check_out);
CREATE INDEX IF NOT EXISTS idx_inquiries_check_in       ON public.inquiries (check_in);
CREATE INDEX IF NOT EXISTS idx_inquiries_confirmed      ON public.inquiries (confirmed_at);
CREATE INDEX IF NOT EXISTS idx_status_events_inquiry
  ON public.inquiry_status_events (inquiry_id, created_at DESC);

COMMIT;


-- ============================================================
-- 5. VERIFY (run after the COMMIT)
-- ============================================================

-- Must show NO rows for inquiry_status_events, and NO amount_cents /
-- confirmed_at / cancelled_at anywhere.
SELECT table_name, grantee, privilege_type, column_name
FROM information_schema.column_privileges
WHERE table_schema='public'
  AND grantee IN ('anon','authenticated')
  AND (table_name='inquiry_status_events'
       OR column_name IN ('amount_cents','currency','confirmed_at','cancelled_at'))
ORDER BY table_name, column_name;

-- Must return NO rows: no table-wide grant on the audit log.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='inquiry_status_events'
  AND grantee IN ('anon','authenticated');

-- Must be true.
SELECT relname, relrowsecurity AS rls_enabled
FROM pg_class WHERE relname='inquiry_status_events';


-- ============================================================
-- 6. OPTIONAL - make double-booking structurally impossible.
--
--    RUN supabase-phase2-overlap-precheck.sql FIRST. If it returns any
--    rows, this WILL fail: fix the overlaps, then run this.
--
--    The API checks for clashes before writing, but check-then-write is
--    not atomic over PostgREST - two admins, or one double-click, can
--    still slip through. This is the only real guarantee.
--
--    '[)' makes check-out exclusive, matching the app, so back-to-back
--    stays (24th-26th then 26th-31st) remain legal.
-- ============================================================
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
-- ALTER TABLE public.property_bookings
--   ADD CONSTRAINT property_bookings_no_overlap
--   EXCLUDE USING gist (
--     property_id WITH =,
--     daterange(start_date, end_date, '[)') WITH &&
--   );


-- ============================================================
-- 7. OPTIONAL - the brand-name fix, one row.
--
--    This edits words attributed to a person. Decide that deliberately.
--    And if that testimonial is not from a real, consenting client, the
--    spelling is not the problem with it.
-- ============================================================
-- UPDATE public.testimonials
--    SET quote = replace(quote, 'High Tunis', 'HighTunis')
--  WHERE quote ILIKE '%high tunis%';
