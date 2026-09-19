-- ============================================================
-- READ-ONLY. One statement, one row, one column.
-- Supabase SQL Editor > paste > Run > copy the single result cell.
-- Replaces having to run the seven sections separately.
-- ============================================================

SELECT jsonb_pretty(jsonb_build_object(

  -- A1: the real columns of inquiries, in order
  'A1_inquiries_columns', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'pos', ordinal_position, 'name', column_name,
             'type', data_type, 'nullable', is_nullable,
             'default', column_default) ORDER BY ordinal_position), '[]'::jsonb)
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inquiries'),

  -- A2: every content table, one line each
  'A2_all_table_columns', (
    SELECT COALESCE(jsonb_object_agg(table_name, cols), '{}'::jsonb)
    FROM (SELECT table_name, string_agg(column_name, ', ' ORDER BY ordinal_position) AS cols
          FROM information_schema.columns
          WHERE table_schema='public'
            AND table_name IN ('properties','services','blog_posts','team',
                               'testimonials','inquiries','property_bookings')
          GROUP BY table_name) t),

  -- A3: columns the zod schemas do NOT know about.
  --     Non-empty here = columns the admin API silently refuses to write.
  'A3_columns_zod_does_not_know', (
    SELECT COALESCE(jsonb_agg(c.table_name || '.' || c.column_name ORDER BY c.table_name, c.ordinal_position), '[]'::jsonb)
    FROM information_schema.columns c
    WHERE c.table_schema='public'
      AND c.table_name IN ('properties','services','blog_posts','team',
                           'testimonials','inquiries','property_bookings')
      AND (c.table_name, c.column_name) NOT IN (
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
        ('property_bookings','created_at'))),

  -- B1: THE DAMAGE. Dates wiped from the columns but still in the message text.
  --     *_from_message are the original values, recoverable.
  'B1_inquiries_with_lost_dates', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'id', id, 'name', name, 'email', email, 'status', status, 'type', type,
             'check_in_now', check_in, 'check_out_now', check_out,
             'check_in_from_message',  NULLIF(split_part(split_part(message,'Check-in: ',2),  chr(10),1),''),
             'check_out_from_message', NULLIF(split_part(split_part(message,'Check-out: ',2), chr(10),1),''),
             'phone_col', phone, 'property_id', property_id,
             'created_at', created_at) ORDER BY created_at DESC), '[]'::jsonb)
    FROM public.inquiries
    WHERE message LIKE '%Check-in:%' AND (check_in IS NULL OR check_out IS NULL)),

  -- B2: scale
  'B2_counts', (
    SELECT jsonb_build_object(
      'total_inquiries', count(*),
      'booking_inquiries', count(*) FILTER (WHERE message LIKE '%Check-in:%'),
      'dates_intact', count(*) FILTER (WHERE message LIKE '%Check-in:%' AND check_in IS NOT NULL),
      'dates_lost',   count(*) FILTER (WHERE message LIKE '%Check-in:%' AND check_in IS NULL))
    FROM public.inquiries),

  -- B3: properties. amenity_count = 0 strongly suggests a Featured/Published
  --     toggle wiped it (the seed gave every property 3 amenities).
  'B3_properties', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'name', name, 'slug', slug, 'published', published, 'featured', featured,
             'order', "order",
             'gallery_count',  jsonb_array_length(COALESCE(gallery,  '[]'::jsonb)),
             'amenity_count',  jsonb_array_length(COALESCE(amenities,'[]'::jsonb)))
           ORDER BY "order", name), '[]'::jsonb)
    FROM public.properties),

  -- B6: booked inquiries with no block on the calendar = needs restoring
  'B6_booked_without_block', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'id', i.id, 'name', i.name, 'status', i.status,
             'property_id', i.property_id,
             'check_in', i.check_in, 'check_out', i.check_out,
             'check_in_from_message',  NULLIF(split_part(split_part(i.message,'Check-in: ',2),  chr(10),1),''),
             'check_out_from_message', NULLIF(split_part(split_part(i.message,'Check-out: ',2), chr(10),1),''))
           ORDER BY i.created_at DESC), '[]'::jsonb)
    FROM public.inquiries i
    LEFT JOIN public.property_bookings b ON b.inquiry_id = i.id
    WHERE i.status = 'booked' AND b.id IS NULL),

  -- B7: blog publication dates
  'B7_blog_posts', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'title', title, 'slug', slug, 'published', published,
             'published_at', published_at, 'created_at', created_at)
           ORDER BY created_at DESC), '[]'::jsonb)
    FROM public.blog_posts)

)) AS damage_report;
