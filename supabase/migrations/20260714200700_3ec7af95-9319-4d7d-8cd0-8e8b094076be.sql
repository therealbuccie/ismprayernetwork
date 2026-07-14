
CREATE TABLE public.group_prayer_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.prayer_groups(id) ON DELETE CASCADE,
  prayer_point_id UUID NOT NULL REFERENCES public.prayer_points(id) ON DELETE CASCADE,
  sent_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, prayer_point_id)
);
CREATE INDEX idx_gpa_group ON public.group_prayer_assignments(group_id);
CREATE INDEX idx_gpa_point ON public.group_prayer_assignments(prayer_point_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_prayer_assignments TO authenticated;
GRANT ALL ON public.group_prayer_assignments TO service_role;

ALTER TABLE public.group_prayer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members and admins can view assignments"
  ON public.group_prayer_assignments FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = group_prayer_assignments.group_id AND m.user_id = auth.uid())
  );

CREATE POLICY "Admins can insert assignments"
  ON public.group_prayer_assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete assignments"
  ON public.group_prayer_assignments FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
