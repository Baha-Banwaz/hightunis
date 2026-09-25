-- ============================================================
-- PHASE 5: UNVERIFIABLE CLAIMS IN TESTIMONIALS
--   Supabase Dashboard > SQL Editor. Read step 1 before running anything.
--
-- Phase 5 asked for unsupported claims and unverifiable statistics to be
-- removed. In the code there were two, both now fixed in the repo. The rest
-- live in the testimonials table, which is content you own, so this is a
-- report and a set of options rather than an edit.
-- ============================================================


-- ------------------------------------------------------------
-- STEP 1: REPORT. Run this first and read the output.
--
-- Flags any published testimonial containing a number, a percentage or a
-- scale word. Each one is a factual claim a reader may rely on, so each one
-- needs a person who can say where it came from.
-- ------------------------------------------------------------
SELECT
  id,
  author,
  role,
  published,
  quote,
  CASE
    WHEN quote ~* '[0-9]+\s*%'                              THEN 'PERCENTAGE'
    WHEN quote ~* '\m(millions?|thousands?|hundreds?)\M'    THEN 'SCALE CLAIM'
    WHEN quote ~* '[0-9]'                                   THEN 'CONTAINS A FIGURE'
  END AS flag
FROM public.testimonials
WHERE quote ~* '[0-9]|\m(millions?|thousands?|hundreds?)\M'
ORDER BY published DESC, author;


-- ------------------------------------------------------------
-- STEP 2: DECIDE, one row at a time.
--
-- For each flagged row, exactly one of these is true:
--
--   A. The client said it and you can evidence it.
--      Leave it alone. Nothing to run.
--
--   B. The client said it, but nobody can evidence the number.
--      Keep the testimonial, drop the figure. Their words about working
--      with you are still their words; the statistic is the part a reader
--      could act on. Use the UPDATE in step 3a with a quote you have
--      agreed with them.
--
--   C. You cannot establish that this person said this at all.
--      Unpublish it. Use step 3b. It stays in the table, so nothing is
--      lost and it can be republished the moment provenance is confirmed.
--
-- Known from earlier in this project:
--   - The "increased 40%" quote (Ahmed B.) you confirmed is a real client
--     who said that figure. That is case A. Leave it.
--   - The "reaches millions" quote (Karim T.) has unknown provenance.
--     Until someone can say where it came from, it is case C.
--
-- Do not guess on anyone's behalf. An unpublished testimonial costs
-- nothing; a fabricated one is not undone by deleting it later.
-- ------------------------------------------------------------


-- ------------------------------------------------------------
-- STEP 3a: CASE B. Replace the quote, keeping the testimonial.
-- Put the id from step 1 and the agreed wording in, then run.
-- ------------------------------------------------------------
-- UPDATE public.testimonials
-- SET quote = 'PASTE THE AGREED WORDING HERE'
-- WHERE id = 'PASTE-THE-ID-HERE';


-- ------------------------------------------------------------
-- STEP 3b: CASE C. Unpublish, without deleting.
-- ------------------------------------------------------------
-- UPDATE public.testimonials
-- SET published = false
-- WHERE id = 'PASTE-THE-ID-HERE';


-- ------------------------------------------------------------
-- STEP 4: VERIFY. What the public site will now show.
-- ------------------------------------------------------------
SELECT author, role, quote
FROM public.testimonials
WHERE published
ORDER BY author;
