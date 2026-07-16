-- ============================================================
-- BOOKINGS & AVAILABILITY MIGRATION — run in the Supabase SQL
-- Editor (Dashboard → SQL Editor → New query → paste → Run).
--
-- Adds:
--   * structured booking fields on inquiries (phone, check-in/out)
--   * image_url on services
--   * property_bookings table: blocked date ranges per property,
--     either created manually in the admin calendar or auto-created
--     when an inquiry is marked "booked"
--   * migrates legacy inquiry statuses (closed→finished,
--     in-progress→contacted)
-- ============================================================

BEGIN;

-- 1. Structured booking data on inquiries
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS check_in DATE;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS check_out DATE;

-- 2. Service images (editable in the admin)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Availability calendar
CREATE TABLE IF NOT EXISTS public.property_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',      -- 'manual' | 'inquiry'
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_range CHECK (end_date > start_date)
);

ALTER TABLE public.property_bookings ENABLE ROW LEVEL SECURITY;

-- The public site reads booked ranges to grey out unavailable dates.
-- Only dates are exposed here — no guest information.
DROP POLICY IF EXISTS "public_read_property_bookings" ON public.property_bookings;
CREATE POLICY "public_read_property_bookings" ON public.property_bookings
  FOR SELECT TO anon, authenticated USING (true);
-- No anon writes: the admin manages bookings via the service role.

CREATE INDEX IF NOT EXISTS idx_property_bookings_prop_dates
  ON public.property_bookings (property_id, start_date, end_date);

-- 4. Migrate legacy inquiry statuses to the new set
--    (new → contacted → booked → finished)
UPDATE public.inquiries SET status = 'finished'  WHERE status = 'closed';
UPDATE public.inquiries SET status = 'contacted' WHERE status = 'in-progress';

COMMIT;
