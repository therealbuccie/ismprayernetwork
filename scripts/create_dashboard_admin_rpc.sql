-- RPC function to power the PIN-protected public dashboard directly in PostgreSQL
CREATE OR REPLACE FUNCTION public.dashboard_admin(body jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pin text;
  v_action text;
  v_table text;
  v_allowed_tables text[] := ARRAY[
    'books', 'categories', 'profiles', 'testimonies', 'programs', 'events',
    'contact_messages', 'newsletter_subscribers', 'prayer_requests', 'prayer_groups',
    'purchase_orders', 'purchases', 'site_settings', 'combo_packs', 'combo_pack_items',
    'campaigns', 'contacts', 'announcements', 'prayer_reports', 'prayer_points',
    'group_prayer_assignments', 'group_call_participations', 'group_members', 'prayer_weeks'
  ];
  v_count bigint;
  v_result jsonb;
  v_data jsonb;
  v_id uuid;
  v_id_text text;
  v_search text;
  v_country text;
  v_page int;
  v_page_size int;
  v_sort_col text;
  v_sort_dir text;
  v_offset int;
  v_total_contacts bigint;
  v_country_meta jsonb;
BEGIN
  -- 1. Validate PIN
  v_pin := body->>'pin';
  IF v_pin IS NULL OR v_pin != '2323' THEN
    RETURN jsonb_build_object('error', 'Invalid PIN');
  END IF;

  v_action := body->>'action';
  v_table := body->>'table';

  -- 2. Validate table if table action
  IF v_table IS NOT NULL AND NOT (v_table = ANY(v_allowed_tables)) THEN
    RETURN jsonb_build_object('error', 'Table not allowed');
  END IF;

  -- 3. Execute action
  CASE v_action
    WHEN 'count' THEN
      EXECUTE format('SELECT count(*) FROM public.%I', v_table) INTO v_count;
      RETURN jsonb_build_object('count', v_count);

    WHEN 'select' THEN
      EXECUTE format(
        'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (SELECT * FROM public.%I) t',
        v_table
      ) INTO v_result;
      RETURN v_result;

    WHEN 'insert' THEN
      v_data := body->'data';
      EXECUTE format(
        'INSERT INTO public.%I SELECT * FROM json_populate_record(null::public.%I, $1::json) RETURNING to_jsonb(public.%I.*)',
        v_table, v_table, v_table
      ) INTO v_result USING v_data;
      RETURN v_result;

    WHEN 'update' THEN
      v_data := body->'data';
      v_id_text := v_data->>'id';
      IF v_id_text IS NULL THEN
        RETURN jsonb_build_object('error', 'Missing id in update data');
      END IF;
      -- Update table
      EXECUTE format(
        'UPDATE public.%I SET (%I) = (SELECT %I FROM json_populate_record(null::public.%I, $1::json)) WHERE id::text = $2 RETURNING to_jsonb(public.%I.*)',
        v_table,
        (SELECT string_agg(quote_ident(column_name), ',') FROM information_schema.columns WHERE table_schema = 'public' AND table_name = v_table AND column_name != 'id'),
        (SELECT string_agg(quote_ident(column_name), ',') FROM information_schema.columns WHERE table_schema = 'public' AND table_name = v_table AND column_name != 'id'),
        v_table, v_table
      ) INTO v_result USING v_data, v_id_text;
      RETURN v_result;

    WHEN 'delete' THEN
      v_data := body->'data';
      v_id_text := COALESCE(v_data->>'id', body->>'id');
      IF v_id_text IS NULL THEN
        RETURN jsonb_build_object('error', 'Missing id for delete');
      END IF;
      EXECUTE format('DELETE FROM public.%I WHERE id::text = $1', v_table) USING v_id_text;
      RETURN jsonb_build_object('success', true);

    WHEN 'database_contacts_meta' THEN
      SELECT count(*) INTO v_total_contacts FROM public.contacts;
      SELECT COALESCE(jsonb_agg(jsonb_build_array(c.country, c.total)), '[]'::jsonb)
      INTO v_country_meta
      FROM (
        SELECT COALESCE(NULLIF(TRIM(country), ''), 'Unknown') AS country, count(*) AS total
        FROM public.contacts
        GROUP BY 1
        ORDER BY total DESC
      ) c;
      RETURN jsonb_build_object(
        'total', v_total_contacts,
        'countries', jsonb_array_length(v_country_meta),
        'countryList', v_country_meta,
        'unknown', 0
      );

    WHEN 'database_contacts' THEN
      v_page := GREATEST(0, COALESCE((body->>'page')::int, 0));
      v_page_size := LEAST(100, GREATEST(1, COALESCE((body->>'page_size')::int, 50)));
      v_offset := v_page * v_page_size;
      v_search := TRIM(COALESCE(body->>'search', ''));
      v_country := COALESCE(body->>'country', 'all');

      SELECT count(*) INTO v_count
      FROM public.contacts
      WHERE (v_search = '' OR (
        first_name ILIKE '%' || v_search || '%' OR
        last_name ILIKE '%' || v_search || '%' OR
        email ILIKE '%' || v_search || '%' OR
        phone ILIKE '%' || v_search || '%' OR
        country ILIKE '%' || v_search || '%'
      ))
      AND (
        v_country = 'all' OR
        (v_country = 'none' AND country IS NULL) OR
        (country ILIKE v_country)
      );

      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb) INTO v_result
      FROM (
        SELECT *
        FROM public.contacts
        WHERE (v_search = '' OR (
          first_name ILIKE '%' || v_search || '%' OR
          last_name ILIKE '%' || v_search || '%' OR
          email ILIKE '%' || v_search || '%' OR
          phone ILIKE '%' || v_search || '%' OR
          country ILIKE '%' || v_search || '%'
        ))
        AND (
          v_country = 'all' OR
          (v_country = 'none' AND country IS NULL) OR
          (country ILIKE v_country)
        )
        ORDER BY created_at DESC
        LIMIT v_page_size OFFSET v_offset
      ) c;

      RETURN jsonb_build_object('rows', v_result, 'count', v_count);

    WHEN 'dashboard_stats' THEN
      RETURN jsonb_build_object(
        'counts', jsonb_build_object(
          'books', (SELECT count(*) FROM public.books),
          'categories', (SELECT count(*) FROM public.categories),
          'users', (SELECT count(*) FROM public.profiles),
          'programs', (SELECT count(*) FROM public.programs),
          'events', (SELECT count(*) FROM public.events),
          'subscribers', (SELECT count(*) FROM public.newsletter_subscribers),
          'prayerGroups', (SELECT count(*) FROM public.prayer_groups),
          'contacts', (SELECT count(*) FROM public.contacts)
        ),
        'testimonies', jsonb_build_object(
          'total', (SELECT count(*) FROM public.testimonies),
          'pending', (SELECT count(*) FROM public.testimonies WHERE is_approved = false),
          'approved', (SELECT count(*) FROM public.testimonies WHERE is_approved = true)
        ),
        'messages', jsonb_build_object(
          'total', (SELECT count(*) FROM public.contact_messages),
          'recent', (SELECT COALESCE(jsonb_agg(m), '[]'::jsonb) FROM (SELECT * FROM public.contact_messages ORDER BY created_at DESC LIMIT 5) m)
        ),
        'prayerRequests', jsonb_build_object(
          'total', (SELECT count(*) FROM public.prayer_requests),
          'totalPrayers', (SELECT COALESCE(sum(prayer_count), 0) FROM public.prayer_requests)
        ),
        'orders', jsonb_build_object(
          'total', (SELECT count(*) FROM public.purchase_orders),
          'pending', (SELECT count(*) FROM public.purchase_orders WHERE status = 'pending'),
          'approved', (SELECT count(*) FROM public.purchase_orders WHERE status = 'approved'),
          'rejected', (SELECT count(*) FROM public.purchase_orders WHERE status = 'rejected'),
          'totalRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM public.purchase_orders WHERE status = 'approved'),
          'recent', (SELECT COALESCE(jsonb_agg(o), '[]'::jsonb) FROM (SELECT * FROM public.purchase_orders ORDER BY created_at DESC LIMIT 5) o)
        ),
        'purchases', jsonb_build_object(
          'total', (SELECT count(*) FROM public.purchases),
          'recent', (SELECT COALESCE(jsonb_agg(p), '[]'::jsonb) FROM (SELECT * FROM public.purchases ORDER BY created_at DESC LIMIT 5) p)
        ),
        'announcements', jsonb_build_object(
          'total', (SELECT count(*) FROM public.announcements),
          'active', (SELECT count(*) FROM public.announcements WHERE is_active = true AND archived = false),
          'archived', (SELECT count(*) FROM public.announcements WHERE archived = true)
        ),
        'prayerPoints', jsonb_build_object(
          'total', (SELECT count(*) FROM public.prayer_points),
          'active', (SELECT count(*) FROM public.prayer_points WHERE is_active = true AND archived = false),
          'archived', (SELECT count(*) FROM public.prayer_points WHERE archived = true)
        ),
        'reports', jsonb_build_object(
          'total', (SELECT count(*) FROM public.prayer_reports),
          'pending', (SELECT count(*) FROM public.prayer_reports WHERE status = 'pending'),
          'reviewed', (SELECT count(*) FROM public.prayer_reports WHERE status = 'reviewed'),
          'totalAttendance', (SELECT COALESCE(sum(attendance), 0) FROM public.prayer_reports),
          'recent', (SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) FROM (SELECT * FROM public.prayer_reports ORDER BY created_at DESC LIMIT 5) r)
        )
      );

    ELSE
      RETURN jsonb_build_object('error', 'Unknown action: ' || COALESCE(v_action, 'null'));
  END CASE;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.dashboard_admin(jsonb) TO anon, authenticated, service_role;
