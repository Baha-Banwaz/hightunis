-- ============================================================
-- BOOKING GUEST DETAILS — run in the Supabase SQL Editor.
-- Adds guest contact fields to property_bookings so manual
-- blocks created in the admin calendar can carry name/email/phone.
-- ============================================================

ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS guest_name  TEXT;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS guest_phone TEXT;
