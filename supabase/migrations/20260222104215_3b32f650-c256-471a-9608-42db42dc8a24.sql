
-- Contact Messages
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact message" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view contact messages" ON public.contact_messages FOR SELECT USING (public.is_admin(auth.uid()));

-- Prayer Requests
CREATE TABLE public.prayer_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'General',
  author_name text NOT NULL DEFAULT 'Anonymous',
  user_id uuid,
  prayer_count integer NOT NULL DEFAULT 0,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view prayer requests" ON public.prayer_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can submit prayer requests" ON public.prayer_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update prayer requests" ON public.prayer_requests FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete prayer requests" ON public.prayer_requests FOR DELETE USING (public.is_admin(auth.uid()));

-- Prayer count tracking
CREATE TABLE public.prayer_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_request_id uuid NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(prayer_request_id, user_id)
);
ALTER TABLE public.prayer_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view prayer interactions" ON public.prayer_interactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can pray" ON public.prayer_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to increment prayer count
CREATE OR REPLACE FUNCTION public.increment_prayer_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE prayer_requests SET prayer_count = prayer_count + 1 WHERE id = NEW.prayer_request_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_prayer_interaction
  AFTER INSERT ON public.prayer_interactions
  FOR EACH ROW EXECUTE FUNCTION public.increment_prayer_count();

-- Prayer Groups
CREATE TABLE public.prayer_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  member_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prayer_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public groups" ON public.prayer_groups FOR SELECT USING (is_public OR created_by = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Authenticated users can create groups" ON public.prayer_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators and admins can update groups" ON public.prayer_groups FOR UPDATE USING (created_by = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Creators and admins can delete groups" ON public.prayer_groups FOR DELETE USING (created_by = auth.uid() OR public.is_admin(auth.uid()));

-- Group Members
CREATE TABLE public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.prayer_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view group members" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Increment/decrement member count
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE prayer_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE prayer_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_group_member_change
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- Testimonies
CREATE TABLE public.testimonies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  author_name text NOT NULL,
  location text,
  user_id uuid,
  video_url text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved testimonies" ON public.testimonies FOR SELECT USING (is_approved OR user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Authenticated users can submit testimonies" ON public.testimonies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update testimonies" ON public.testimonies FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete testimonies" ON public.testimonies FOR DELETE USING (public.is_admin(auth.uid()));
