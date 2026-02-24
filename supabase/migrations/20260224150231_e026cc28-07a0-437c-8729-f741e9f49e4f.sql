
-- Events table for birthday celebrations (admin-created)
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_name text NOT NULL,
  minister_image_url text,
  birthday_day integer NOT NULL,
  birthday_month integer NOT NULL,
  description text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (is_admin(auth.uid()));

-- Birthday wishes
CREATE TABLE public.birthday_wishes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid,
  author_name text NOT NULL DEFAULT 'Anonymous',
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.birthday_wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wishes" ON public.birthday_wishes FOR SELECT USING (true);
CREATE POLICY "Anyone can post wishes" ON public.birthday_wishes FOR INSERT WITH CHECK (true);

-- Programs table
CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_date timestamp with time zone,
  location text,
  image_url text,
  is_upcoming boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Admins can insert programs" ON public.programs FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update programs" ON public.programs FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete programs" ON public.programs FOR DELETE USING (is_admin(auth.uid()));

-- Newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text,
  subscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers FOR SELECT USING (is_admin(auth.uid()));
