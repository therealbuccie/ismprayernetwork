CREATE TABLE public.program_dispatches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  program_title TEXT,
  subject TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  match_mode TEXT NOT NULL DEFAULT 'manual',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_dispatches TO authenticated;
GRANT ALL ON public.program_dispatches TO service_role;
ALTER TABLE public.program_dispatches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage program dispatches" ON public.program_dispatches FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_program_dispatches_updated_at BEFORE UPDATE ON public.program_dispatches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.program_engagements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_id UUID NOT NULL REFERENCES public.program_dispatches(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  country TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (dispatch_id, email)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_engagements TO authenticated;
GRANT ALL ON public.program_engagements TO service_role;
ALTER TABLE public.program_engagements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage program engagements" ON public.program_engagements FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_program_engagements_updated_at BEFORE UPDATE ON public.program_engagements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_program_engagements_program ON public.program_engagements(program_id);
CREATE INDEX idx_program_engagements_email ON public.program_engagements(lower(email));
CREATE INDEX idx_program_engagements_dispatch ON public.program_engagements(dispatch_id);