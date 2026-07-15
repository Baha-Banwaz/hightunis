-- ============================================================
-- SCHEMA DRIFT PATCH — run in the Supabase SQL Editor (optional
-- but recommended). The live database was not created from
-- supabase-schema.sql and is missing created_at on 3 tables.
-- Also (re)creates the one index that failed because of this.
-- ============================================================

ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.team         ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.services     ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_testimonials_pub_created ON public.testimonials (published, created_at DESC);
