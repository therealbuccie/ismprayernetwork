
CREATE TABLE public.group_call_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.prayer_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  participant_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gcp_group ON public.group_call_participations(group_id);
CREATE INDEX idx_gcp_user ON public.group_call_participations(user_id);

GRANT SELECT, INSERT, UPDATE ON public.group_call_participations TO authenticated;
GRANT ALL ON public.group_call_participations TO service_role;

ALTER TABLE public.group_call_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own participation"
  ON public.group_call_participations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own participation"
  ON public.group_call_participations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own, admins view all"
  ON public.group_call_participations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
