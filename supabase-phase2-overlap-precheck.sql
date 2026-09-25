-- ============================================================
-- READ-ONLY. Changes nothing.
--
-- Gates section 6 of supabase-phase2-schema.sql. The exclusion constraint
-- cannot be added while overlapping rows exist.
--
-- Worth running regardless: any row here is a property double-booked right
-- now. The inquiry edit modal has no overlap check today, so this is
-- reachable without anyone doing anything wrong.
--
-- '[)' = check-out exclusive, matching the app. Back-to-back stays
-- (24th-26th then 26th-31st) are NOT overlaps and will not appear.
-- ============================================================

SELECT
  p.name                                   AS property,
  a.start_date || ' -> ' || a.end_date     AS booking_a,
  COALESCE(a.guest_name, a.note, a.source) AS guest_a,
  a.source                                 AS source_a,
  b.start_date || ' -> ' || b.end_date     AS booking_b,
  COALESCE(b.guest_name, b.note, b.source) AS guest_b,
  b.source                                 AS source_b,
  daterange(a.start_date, a.end_date, '[)')
    * daterange(b.start_date, b.end_date, '[)')  AS overlapping_nights
FROM public.property_bookings a
JOIN public.property_bookings b
  ON a.property_id = b.property_id
 AND a.id < b.id                                  -- each pair once
 AND daterange(a.start_date, a.end_date, '[)')
  && daterange(b.start_date, b.end_date, '[)')
LEFT JOIN public.properties p ON p.id = a.property_id
ORDER BY p.name, a.start_date;

-- No rows  -> section 6 is safe to run.
-- Any rows -> those properties are double-booked today. Resolve first.
