-- ============================================================
-- READ-ONLY. One statement, one cell. Nothing is modified.
-- Answers the open questions for the admin phase-2 plan.
-- ============================================================

SELECT jsonb_pretty(jsonb_build_object(

  -- 1. Is anything constraining inquiries.status? A CHECK constraint would
  --    reject 'cancelled' until it is altered.
  'status_constraints', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'name', con.conname, 'type', con.contype,
             'definition', pg_get_constraintdef(con.oid))), '[]'::jsonb)
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname='public' AND rel.relname='inquiries'),

  -- 2. What status values actually exist? Legacy values would break a new
  --    CHECK constraint, and tell us whether the 'closed'/'in-progress'
  --    migration ever ran.
  'status_values', (
    SELECT COALESCE(jsonb_object_agg(COALESCE(status,'<null>'), n), '{}'::jsonb)
    FROM (SELECT status, count(*) AS n FROM public.inquiries GROUP BY status) t),

  -- 3. THE REVENUE QUESTION. properties.price is text. Show it raw.
  'price_values', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'name', name, 'category', category, 'price', price)
           ORDER BY "order"), '[]'::jsonb)
    FROM public.properties),

  -- 4. Any numeric/money column anywhere we could sum? Expect none.
  'numeric_columns', (
    SELECT COALESCE(jsonb_agg(table_name || '.' || column_name || ' (' || data_type || ')'
           ORDER BY table_name, column_name), '[]'::jsonb)
    FROM information_schema.columns
    WHERE table_schema='public'
      AND data_type IN ('integer','bigint','numeric','real','double precision','money','smallint')
      AND table_name IN ('properties','services','blog_posts','team',
                         'testimonials','inquiries','property_bookings')),

  -- 5. Indexes. Drives whether filtering/sorting needs new ones.
  'indexes', (
    SELECT COALESCE(jsonb_object_agg(tablename, defs), '{}'::jsonb)
    FROM (SELECT tablename, jsonb_agg(indexdef ORDER BY indexname) AS defs
          FROM pg_indexes WHERE schemaname='public'
            AND tablename IN ('inquiries','property_bookings','properties')
          GROUP BY tablename) t),

  -- 6. Evidence for the confirmed_at problem: property_bookings.created_at is
  --    rewritten every time the inquiry is edited, so it cannot date a booking.
  --    Rows where the block was created well after the inquiry arrived.
  'booking_vs_inquiry_dates', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'guest', i.name,
             'inquiry_created', i.created_at,
             'block_created', b.created_at,
             'check_in', i.check_in, 'check_out', i.check_out,
             'status', i.status) ORDER BY b.created_at), '[]'::jsonb)
    FROM public.property_bookings b
    JOIN public.inquiries i ON i.id = b.inquiry_id),

  -- 7. Stay data we CAN derive today without any new column.
  'stay_stats', (
    SELECT jsonb_build_object(
      'with_both_dates', count(*) FILTER (WHERE check_in IS NOT NULL AND check_out IS NOT NULL),
      'total_nights',    COALESCE(sum(check_out - check_in) FILTER (WHERE check_in IS NOT NULL AND check_out IS NOT NULL), 0),
      'past_checkout_still_booked', count(*) FILTER (WHERE status='booked' AND check_out < current_date),
      'earliest_check_in', min(check_in), 'latest_check_out', max(check_out))
    FROM public.inquiries),

  -- 8. Brand name: "High Tunis" as two words, anywhere in editable content.
  --    It appears NOWHERE in the tracked source, so any occurrence is data.
  'two_word_brand_in_content', (
    SELECT COALESCE(jsonb_agg(hit ORDER BY hit), '[]'::jsonb) FROM (
      SELECT 'properties.name: '        || name        AS hit FROM public.properties   WHERE name        ILIKE '%high tunis%'
      UNION ALL SELECT 'properties.description: ' || left(description,80) FROM public.properties   WHERE description ILIKE '%high tunis%'
      UNION ALL SELECT 'services.title: '         || title              FROM public.services     WHERE title       ILIKE '%high tunis%'
      UNION ALL SELECT 'services.description: '   || left(description,80) FROM public.services   WHERE description ILIKE '%high tunis%'
      UNION ALL SELECT 'blog_posts.title: '       || title              FROM public.blog_posts   WHERE title       ILIKE '%high tunis%'
      UNION ALL SELECT 'blog_posts.excerpt: '     || left(excerpt,80)   FROM public.blog_posts   WHERE excerpt     ILIKE '%high tunis%'
      UNION ALL SELECT 'blog_posts.content: '     || left(content,80)   FROM public.blog_posts   WHERE content     ILIKE '%high tunis%'
      UNION ALL SELECT 'testimonials.quote: '     || left(quote,80)     FROM public.testimonials WHERE quote       ILIKE '%high tunis%'
      UNION ALL SELECT 'testimonials.author: '    || author            FROM public.testimonials WHERE author      ILIKE '%high tunis%'
      UNION ALL SELECT 'team.bio: '               || left(bio,80)       FROM public.team         WHERE bio         ILIKE '%high tunis%'
      UNION ALL SELECT 'team.role: '              || role              FROM public.team         WHERE role        ILIKE '%high tunis%'
      UNION ALL SELECT 'inquiries.message: '      || left(message,80)   FROM public.inquiries    WHERE message     ILIKE '%high tunis%'
    ) x),

  -- 9. Is pg_cron available, for the auto-finish options?
  'extensions', (
    SELECT COALESCE(jsonb_object_agg(name, COALESCE(installed_version,'not installed')), '{}'::jsonb)
    FROM pg_available_extensions WHERE name IN ('pg_cron','pg_net','pgcrypto')),

  -- 10. Volume, to size the filtering approach.
  'row_counts', jsonb_build_object(
    'inquiries', (SELECT count(*) FROM public.inquiries),
    'property_bookings', (SELECT count(*) FROM public.property_bookings),
    'properties', (SELECT count(*) FROM public.properties))

)) AS phase2_report;
