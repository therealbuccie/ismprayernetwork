CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  record_label text,
  changed_fields text[],
  old_data jsonb,
  new_data jsonb
);

CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_table_idx ON public.activity_logs (table_name);
CREATE INDEX IF NOT EXISTS activity_logs_actor_idx ON public.activity_logs (actor_id);

GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view activity logs"
ON public.activity_logs FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text;
  v_role text;
  v_old jsonb;
  v_new jsonb;
  v_changed text[];
  v_label text;
  v_id text;
  k text;
BEGIN
  BEGIN
    SELECT p.email, p.role INTO v_email, v_role FROM public.profiles p WHERE p.user_id = v_actor LIMIT 1;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
  ELSIF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_changed := ARRAY[]::text[];
    FOR k IN SELECT jsonb_object_keys(v_new) LOOP
      IF (v_new -> k) IS DISTINCT FROM (v_old -> k) AND k <> 'updated_at' THEN
        v_changed := array_append(v_changed, k);
      END IF;
    END LOOP;
    IF array_length(v_changed, 1) IS NULL THEN
      RETURN NULL;
    END IF;
  END IF;

  v_id := COALESCE(v_new ->> 'id', v_old ->> 'id');
  v_label := COALESCE(
    v_new ->> 'title', v_old ->> 'title',
    v_new ->> 'name', v_old ->> 'name',
    v_new ->> 'full_name', v_old ->> 'full_name',
    v_new ->> 'email', v_old ->> 'email',
    v_new ->> 'subject', v_old ->> 'subject'
  );

  INSERT INTO public.activity_logs (actor_id, actor_email, actor_role, action, table_name, record_id, record_label, changed_fields, old_data, new_data)
  VALUES (v_actor, v_email, v_role, TG_OP, TG_TABLE_NAME, v_id, v_label, v_changed, v_old, v_new);

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY[
  'profiles','contacts','books','categories','combo_packs','purchases','orders',
  'prayer_requests','prayer_groups','group_members','prayer_points','prayer_weeks',
  'prayer_reports','announcements','events','programs','campaigns','testimonies',
  'newsletter_subscribers','contact_messages','site_settings','group_prayer_assignments',
  'program_dispatches','user_roles'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_activity_log ON public.%I', t);
      EXECUTE format('CREATE TRIGGER trg_activity_log AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_activity()', t);
    END IF;
  END LOOP;
END $$;