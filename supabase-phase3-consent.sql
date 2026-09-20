-- ============================================================
-- PHASE 3: FORM CONSENT  --  Supabase Dashboard > SQL Editor
--
-- Run this BEFORE deploying the phase-3 code. The API writes these columns
-- on every new enquiry; without them every submission fails.
--
-- ############################################################
-- #  PRIVACY: NO GRANTS FOR THESE COLUMNS                     #
-- ############################################################
--   consent_given, consent_text, consented_at are part of the enquiry
--   record, which anon already cannot read at all (column-privacy revoked
--   every grant on public.inquiries). Nothing below re-grants anything, and
--   nothing should. They are read only by /api/admin/* with the service role.
-- ============================================================

BEGIN;

-- Why three columns rather than one boolean:
--
--   consent_given  what they chose.
--   consent_text   the exact wording they were shown. GDPR Art 7(1) puts the
--                  burden on you to DEMONSTRATE consent, and "they ticked a
--                  box" is not a demonstration if nobody can say what the box
--                  said. Wording changes over time; this pins it per record.
--   consented_at   when. Separate from created_at so it stays meaningful if
--                  consent is ever re-collected.
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS consent_given boolean NOT NULL DEFAULT false;
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS consent_text text;
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS consented_at timestamptz;

COMMENT ON COLUMN public.inquiries.consent_given IS
  'Did the sender tick the contact-consent box. PRIVATE, never grant to anon.';
COMMENT ON COLUMN public.inquiries.consent_text IS
  'Verbatim wording shown at the time, for GDPR Art 7(1). PRIVATE.';
COMMENT ON COLUMN public.inquiries.consented_at IS
  'When consent was given. PRIVATE.';

-- Existing rows predate the checkbox. They are left false with a null
-- timestamp, which is the honest record: consent was never asked for, so it
-- must not be claimed. Backfilling these to true would manufacture evidence.

COMMIT;


-- ============================================================
-- VERIFY
-- ============================================================

-- Should list the three columns.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'inquiries'
  AND column_name IN ('consent_given', 'consent_text', 'consented_at')
ORDER BY column_name;

-- MUST return no rows: the public roles hold nothing on inquiries.
SELECT grantee, privilege_type, column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'inquiries'
  AND grantee IN ('anon', 'authenticated');

-- How many historical enquiries have no recorded consent. Expected: all of
-- them, because the checkbox did not exist when they were sent.
SELECT count(*) FILTER (WHERE consent_given) AS with_consent,
       count(*) FILTER (WHERE NOT consent_given) AS without_consent
FROM public.inquiries;
