CREATE TABLE public.prayer_weeks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start date NOT NULL,
  title text NOT NULL,
  intro text,
  points jsonb NOT NULL DEFAULT '[]'::jsonb,
  conclusion text,
  confession_topic text,
  confession_scripture text,
  affirmations text,
  song_title text,
  song_artist text,
  song_url text,
  song_lyrics text,
  is_active boolean NOT NULL DEFAULT true,
  archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prayer_weeks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prayer_weeks TO authenticated;
GRANT ALL ON public.prayer_weeks TO service_role;

ALTER TABLE public.prayer_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prayer weeks"
ON public.prayer_weeks FOR SELECT
USING (true);

CREATE POLICY "Admins can insert prayer weeks"
ON public.prayer_weeks FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update prayer weeks"
ON public.prayer_weeks FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete prayer weeks"
ON public.prayer_weeks FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_prayer_weeks_updated_at
BEFORE UPDATE ON public.prayer_weeks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();