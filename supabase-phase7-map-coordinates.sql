-- ============================================================
-- PHASE 7: MAP COORDINATES  --  Supabase Dashboard > SQL Editor
--
-- Adds latitude/longitude to public.properties so the collection page can
-- show an approximate-location map.
--
-- ############################################################
-- #  WHY THE REVOKE BELOW IS NOT OPTIONAL                     #
-- ############################################################
--   Supabase grants new COLUMNS to anon automatically, the same way it
--   grants new TABLES. The column-privacy migration replaced the blanket
--   grant on public.properties with an explicit column list, and that list
--   is the control. Adding a column without re-issuing the list would leave
--   the new columns readable on the default grant.
--
--   So: REVOKE ALL first, then GRANT the full list again, with the two new
--   columns added. Removing a column from the list below removes public
--   read access to it. Read the list before you run this.
--
--   Same reasoning as inquiry_status_events, which is sealed on both layers.
-- ============================================================

BEGIN;

-- double precision, not numeric: these are measurements, not money, and
-- every mapping library hands them to the browser as floats anyway.
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS latitude  double precision;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS longitude double precision;

-- Range checks catch the single most common coordinate bug: latitude and
-- longitude entered the wrong way round. Tunisia sits near 33-37 N, 8-11 E,
-- so a swap puts a property in the Indian Ocean rather than failing loudly.
-- Deliberately the full legal range rather than a Tunisia box, so the
-- constraint never blocks a legitimate listing elsewhere later.
ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_latitude_range;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_latitude_range
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90);

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_longitude_range;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_longitude_range
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

-- Both or neither. A property with one coordinate cannot be placed, and
-- would otherwise sit in the data looking usable.
ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_coords_complete;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_coords_complete
  CHECK ((latitude IS NULL) = (longitude IS NULL));

COMMENT ON COLUMN public.properties.latitude IS
  'Real latitude of the property. PUBLIC, but never rendered exactly: the
   collection map draws an approximate circle around it, not a pin.';
COMMENT ON COLUMN public.properties.longitude IS
  'Real longitude of the property. PUBLIC, same approximation as latitude.';

-- ------------------------------------------------------------
-- Column privacy. The list below is the whole of what anon may read from
-- public.properties. It is the previous list plus latitude and longitude.
-- ------------------------------------------------------------
REVOKE ALL ON public.properties FROM anon, authenticated;

GRANT SELECT (
  id, name, slug, category, location, price, description,
  image_url, gallery, amenities, featured, published, "order", created_at,
  latitude, longitude
) ON public.properties TO anon, authenticated;

COMMIT;


-- ============================================================
-- VERIFY  --  run these after the transaction above commits
-- ============================================================

-- 1. The two columns exist and are nullable.
--    EXPECT: exactly 2 rows, both double precision, both YES.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'properties'
  AND column_name IN ('latitude', 'longitude')
ORDER BY column_name;

-- 2. The three constraints exist.
--    EXPECT: 3 rows.
SELECT conname
FROM pg_constraint
WHERE conrelid = 'public.properties'::regclass
  AND conname IN ('properties_latitude_range',
                  'properties_longitude_range',
                  'properties_coords_complete')
ORDER BY conname;

-- 3. THE IMPORTANT ONE. What anon may now read from properties.
--    EXPECT: 16 column names, including latitude and longitude, and
--    NOTHING else. If a column you did not expect appears, stop and say so.
SELECT column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'properties'
  AND grantee = 'anon'
ORDER BY column_name;

-- 4. anon still holds no table-level privilege on properties.
--    EXPECT: no rows. A row here means the column list is being bypassed.
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' AND table_name = 'properties'
  AND grantee IN ('anon', 'authenticated');

-- 5. Nothing has coordinates yet, which is correct: they are entered by
--    hand in the admin, one property at a time.
--    EXPECT: with_coords 0, without_coords 9.
SELECT count(*) FILTER (WHERE latitude IS NOT NULL) AS with_coords,
       count(*) FILTER (WHERE latitude IS NULL)     AS without_coords
FROM public.properties;

-- 6. The swap guard works. EXPECT: this fails with a check violation.
--    If it succeeds, the constraint did not apply. Roll back either way.
-- BEGIN;
--   UPDATE public.properties SET latitude = 181, longitude = 10 WHERE true;
-- ROLLBACK;


-- ============================================================
-- ROLLBACK, if you need it
-- ============================================================
-- BEGIN;
--   ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_coords_complete;
--   ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_latitude_range;
--   ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_longitude_range;
--   ALTER TABLE public.properties DROP COLUMN IF EXISTS latitude;
--   ALTER TABLE public.properties DROP COLUMN IF EXISTS longitude;
--   REVOKE ALL ON public.properties FROM anon, authenticated;
--   GRANT SELECT (
--     id, name, slug, category, location, price, description,
--     image_url, gallery, amenities, featured, published, "order", created_at
--   ) ON public.properties TO anon, authenticated;
-- COMMIT;
