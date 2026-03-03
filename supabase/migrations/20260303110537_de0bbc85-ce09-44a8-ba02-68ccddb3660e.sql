
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  link_url TEXT NOT NULL DEFAULT '/bookstore',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_type TEXT NOT NULL DEFAULT 'both',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active campaigns" ON public.campaigns
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert campaigns" ON public.campaigns
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update campaigns" ON public.campaigns
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete campaigns" ON public.campaigns
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
