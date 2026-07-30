CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  country text,
  group_name text,
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX contacts_email_unique ON public.contacts (lower(email)) WHERE email IS NOT NULL AND email <> '';
CREATE INDEX contacts_group_name_idx ON public.contacts (group_name);
CREATE INDEX contacts_created_at_idx ON public.contacts (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contacts" ON public.contacts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update contacts" ON public.contacts FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();