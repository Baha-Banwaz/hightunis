-- ============================================================
-- READ-ONLY. Changes nothing. Supabase Dashboard > SQL Editor.
--
-- Two jobs:
--   A) report the ACTUAL columns, so the zod schemas can be rebuilt from
--      the live database instead of from supabase-schema.sql
--   B) find rows damaged by the partial-update default injection
-- ============================================================


-- ============================================================
-- A. ACTUAL COLUMNS  (this is the authoritative list)
-- ============================================================

-- A1. inquiries, in order. Compare against the zod schema's nine fields:
--     name, email, phone, type, message, status, property_id,
--     check_in, check_out
SELECT ordinal_position AS pos, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'inquiries'
ORDER BY ordinal_position;

-- A2. Every content table at once, as a compact one-row-per-table summary.
SELECT table_name,
       string_agg(column_name, ', ' ORDER BY ordinal_position) AS columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('properties','services','blog_posts','team',
                     'testimonials','inquiries','property_bookings')
GROUP BY table_name
ORDER BY table_name;

-- A3. Columns the zod schemas do NOT know about. Anything listed here is a
--     column the admin API would silently refuse to write.
WITH known(table_name, column_name) AS (
  VALUES
    ('properties','id'),('properties','name'),('properties','slug'),
    ('properties','category'),('properties','location'),('properties','price'),
    ('properties','description'),('properties','image_url'),('properties','gallery'),
    ('properties','amenities'),('properties','featured'),('properties','published'),
    ('properties','order'),('properties','created_at'),
    ('services','id'),('services','title'),('services','description'),
    ('services','icon'),('services','image_url'),('services','order'),
    ('services','published'),('services','created_at'),
    ('blog_posts','id'),('blog_posts','title'),('blog_posts','slug'),
    ('blog_posts','content'),('blog_posts','cover_image'),('blog_posts','excerpt'),
    ('blog_posts','published'),('blog_posts','published_at'),('blog_posts','created_at'),
    ('team','id'),('team','name'),('team','role'),('team','photo_url'),
    ('team','bio'),('team','order'),('team','created_at'),
    ('testimonials','id'),('testimonials','author'),('testimonials','role'),
    ('testimonials','quote'),('testimonials','photo_url'),('testimonials','published'),
    ('testimonials','created_at'),
    ('inquiries','id'),('inquiries','name'),('inquiries','email'),('inquiries','type'),
    ('inquiries','message'),('inquiries','property_id'),('inquiries','status'),
    ('inquiries','phone'),('inquiries','check_in'),('inquiries','check_out'),
    ('inquiries','created_at'),
    ('property_bookings','id'),('property_bookings','property_id'),
    ('property_bookings','start_date'),('property_bookings','end_date'),
    ('property_bookings','source'),('property_bookings','inquiry_id'),
    ('property_bookings','note'),('property_bookings','guest_name'),
    ('property_bookings','guest_email'),('property_bookings','guest_phone'),
    ('property_bookings','created_at')
)
SELECT c.table_name, c.column_name, c.data_type, c.is_nullable
FROM information_schema.columns c
LEFT JOIN known k
  ON k.table_name = c.table_name AND k.column_name = c.column_name
WHERE c.table_schema = 'public'
  AND c.table_name IN ('properties','services','blog_posts','team',
                       'testimonials','inquiries','property_bookings')
  AND k.column_name IS NULL
ORDER BY c.table_name, c.ordinal_position;


-- ============================================================
-- B. DAMAGE ASSESSMENT
-- ============================================================

-- B1. THE REPORTED BUG, and its recovery data.
--     Any inquiry whose message still records the dates but whose date
--     columns are now NULL had them wiped by an inline status change.
--     message_* are the original values, recoverable.
SELECT
  id,
  name,
  email,
  status,
  type,
  check_in                                                           AS check_in_now,
  check_out                                                          AS check_out_now,
  split_part(split_part(message, 'Check-in: ',  2), chr(10), 1)      AS check_in_from_message,
  split_part(split_part(message, 'Check-out: ', 2), chr(10), 1)      AS check_out_from_message,
  split_part(split_part(message, 'Phone: ',     2), chr(10), 1)      AS phone_from_message,
  property_id,
  created_at
FROM public.inquiries
WHERE message LIKE '%Check-in:%'
  AND (check_in IS NULL OR check_out IS NULL)
ORDER BY created_at DESC;

-- B2. Scale: how many booking inquiries still have their dates vs lost them.
SELECT
  count(*) FILTER (WHERE message LIKE '%Check-in:%')                              AS booking_inquiries,
  count(*) FILTER (WHERE message LIKE '%Check-in:%' AND check_in IS NOT NULL)     AS dates_intact,
  count(*) FILTER (WHERE message LIKE '%Check-in:%' AND check_in IS NULL)         AS dates_lost
FROM public.inquiries;

-- B3. PROPERTIES - the worse case. A featured/published toggle writes
--     gallery=[] and amenities=[] and order=0.
--     The seed data gave every property 3 amenities, so amenity_count = 0
--     is a strong signal the row was toggled. There is no updated_at
--     column, so timestamps cannot narrow this further.
SELECT
  name,
  slug,
  published,
  featured,
  "order",
  jsonb_array_length(COALESCE(gallery,   '[]'::jsonb)) AS gallery_count,
  jsonb_array_length(COALESCE(amenities, '[]'::jsonb)) AS amenity_count,
  created_at
FROM public.properties
ORDER BY "order", name;

-- B4. Order collisions: several rows sharing "order" = 0 suggests a reset.
SELECT 'properties' AS tbl, "order", count(*) FROM public.properties GROUP BY "order"
UNION ALL
SELECT 'services',          "order", count(*) FROM public.services   GROUP BY "order"
UNION ALL
SELECT 'team',              "order", count(*) FROM public.team       GROUP BY "order"
ORDER BY tbl, "order";

-- B5. property_bookings: a calendar edit writes source='manual' and
--     inquiry_id=NULL, breaking the link back to the inquiry.
--     Rows with a guest name but no inquiry_id are suspects.
SELECT id, property_id, start_date, end_date, source, inquiry_id,
       note, guest_name, guest_email, created_at
FROM public.property_bookings
ORDER BY start_date;

-- B6. Inquiries marked booked that have no block on the calendar.
--     These are the ones whose dates need restoring and re-blocking.
SELECT i.id, i.name, i.status, i.property_id, i.check_in, i.check_out
FROM public.inquiries i
LEFT JOIN public.property_bookings b ON b.inquiry_id = i.id
WHERE i.status = 'booked' AND b.id IS NULL
ORDER BY i.created_at DESC;

-- B7. blog_posts: unpublishing writes published_at=NULL, losing the
--     original publication date.
SELECT id, title, slug, published, published_at, created_at
FROM public.blog_posts
ORDER BY created_at DESC;
