-- ==============================================================================
-- ISM PRAYER NETWORK - UNIFIED PRODUCTION SCHEMA FOR NEW SUPABASE PROJECT
-- Generated for Emergency Cloudflare Pages & Supabase Migration
-- ==============================================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";


-- ----------------------------------------------------------------------------
-- Migration: 20260221090504_788dffd4-06b0-46c7-aae1-0604c99c625f.sql
-- ----------------------------------------------------------------------------
-- Categories for books
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  is_digital BOOLEAN NOT NULL DEFAULT false,
  is_physical BOOLEAN NOT NULL DEFAULT true,
  digital_file_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  pages INTEGER,
  isbn TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Books: public read
CREATE POLICY "Anyone can view books" ON public.books FOR SELECT USING (true);

-- Profiles: users can view/update own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed categories
INSERT INTO public.categories (name) VALUES
  ('Theology'),
  ('Prayer & Devotion'),
  ('Leadership'),
  ('Bible Study'),
  ('Ministry'),
  ('Family & Relationships');

-- Seed sample books
INSERT INTO public.books (title, author, description, price, is_digital, is_physical, category_id, stock, pages, featured, cover_image_url) VALUES
  ('The Power of Prayer', 'Rev. James Walker', 'A transformative guide to deepening your prayer life and experiencing God''s presence in every moment.', 24.99, true, true, (SELECT id FROM public.categories WHERE name = 'Prayer & Devotion'), 150, 320, true, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
  ('Leading with Grace', 'Dr. Sarah Mitchell', 'Biblical principles for servant leadership in ministry and beyond.', 19.99, true, true, (SELECT id FROM public.categories WHERE name = 'Leadership'), 200, 256, true, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'),
  ('Foundations of Faith', 'Pastor Michael Brown', 'An in-depth study of core Christian doctrines for the modern believer.', 29.99, false, true, (SELECT id FROM public.categories WHERE name = 'Theology'), 75, 480, true, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'),
  ('The Minister''s Handbook', 'Dr. Ruth Peterson', 'Essential guidance for pastors and ministers navigating the complexities of modern ministry.', 34.99, true, true, (SELECT id FROM public.categories WHERE name = 'Ministry'), 120, 400, false, 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400'),
  ('Walking in the Word', 'Rev. David Chen', 'A 52-week Bible study guide designed for personal and group study.', 16.99, true, false, (SELECT id FROM public.categories WHERE name = 'Bible Study'), 0, 210, false, 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=400'),
  ('Marriage & Ministry', 'Pastor & Mrs. Thompson', 'Balancing the call to ministry with a thriving marriage and family life.', 21.99, true, true, (SELECT id FROM public.categories WHERE name = 'Family & Relationships'), 90, 288, true, 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400'),
  ('Revival Fire', 'Evangelist Mark Stone', 'Stories and strategies from the greatest revivals in Christian history.', 18.99, true, true, (SELECT id FROM public.categories WHERE name = 'Prayer & Devotion'), 160, 340, false, 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400'),
  ('Shepherding God''s Flock', 'Bishop James Okafor', 'Practical pastoral care for congregations of every size.', 27.99, false, true, (SELECT id FROM public.categories WHERE name = 'Ministry'), 55, 360, false, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400');

-- ----------------------------------------------------------------------------
-- Migration: 20260222103219_156a39f2-6a51-4ed9-acc0-2f7dbbe14ff1.sql
-- ----------------------------------------------------------------------------
-- Create a function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create a function to check if user is admin or super-admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'super-admin')
  );
$$;

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'stacomzy20@gmail.com' THEN 'super-admin' ELSE 'customer' END
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing profiles RLS: admins can view all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile or admins can view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Admins can update any profile (for role changes)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile or admins can update all"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Books: admins can INSERT, UPDATE, DELETE
CREATE POLICY "Admins can insert books"
  ON public.books FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update books"
  ON public.books FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete books"
  ON public.books FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Categories: admins can INSERT, UPDATE, DELETE
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create storage bucket for book covers
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view book covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

CREATE POLICY "Admins can upload book covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'book-covers' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update book covers"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'book-covers' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete book covers"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'book-covers' AND public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- Migration: 20260222104215_3b32f650-c256-471a-9608-42db42dc8a24.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Migration: 20260224150033_6597988c-7890-40dd-8c3a-83c6c3fc2e9d.sql
-- ----------------------------------------------------------------------------
-- Add ministry_name, dob_day, dob_month to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ministry_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob_day integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob_month integer;

-- Update handle_new_user to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, ministry_name, dob_day, dob_month)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'stacomzy20@gmail.com' THEN 'super-admin' ELSE 'customer' END,
    COALESCE(NEW.raw_user_meta_data->>'ministry_name', ''),
    (NEW.raw_user_meta_data->>'dob_day')::integer,
    (NEW.raw_user_meta_data->>'dob_month')::integer
  );
  RETURN NEW;
END;
$function$;

-- ----------------------------------------------------------------------------
-- Migration: 20260224150231_e026cc28-07a0-437c-8729-f741e9f49e4f.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Migration: 20260226235716_03202daf-bf4a-47c6-8f6f-7ed79fd8e87d.sql
-- ----------------------------------------------------------------------------
-- Prayer room sessions: each user can create a unique prayer session
CREATE TABLE public.prayer_room_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  owner_id uuid NOT NULL,
  owner_name text NOT NULL DEFAULT 'A Minister',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Participants who join via unique link
CREATE TABLE public.prayer_room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.prayer_room_sessions(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  location text,
  joined_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prayer_room_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_room_participants ENABLE ROW LEVEL SECURITY;

-- Sessions: anyone can view, authenticated can create, owner can update/delete
CREATE POLICY "Anyone can view sessions" ON public.prayer_room_sessions FOR SELECT USING (true);
CREATE POLICY "Auth users can create sessions" ON public.prayer_room_sessions FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update sessions" ON public.prayer_room_sessions FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete sessions" ON public.prayer_room_sessions FOR DELETE USING (auth.uid() = owner_id);

-- Participants: anyone can view and join (no auth required for visitors)
CREATE POLICY "Anyone can view participants" ON public.prayer_room_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can join" ON public.prayer_room_participants FOR INSERT WITH CHECK (true);

-- Enable realtime for participants so owner sees joins live
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_room_participants;

-- ----------------------------------------------------------------------------
-- Migration: 20260227115236_8e0cec9a-dc87-44bd-a74d-317347dd337c.sql
-- ----------------------------------------------------------------------------
-- Add CloudPDF document ID to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS cloudpdf_document_id text;

-- Create purchases table to track user book ownership
CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  format text NOT NULL DEFAULT 'digital' CHECK (format IN ('digital', 'physical', 'both')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
  amount numeric NOT NULL DEFAULT 0,
  stripe_payment_id text,
  granted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, format)
);

-- RLS for purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Admins can insert purchases (manual grant)
CREATE POLICY "Admins can insert purchases" ON public.purchases
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Admins can update purchases
CREATE POLICY "Admins can update purchases" ON public.purchases
  FOR UPDATE USING (is_admin(auth.uid()));

-- Admins can delete purchases
CREATE POLICY "Admins can delete purchases" ON public.purchases
  FOR DELETE USING (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- Migration: 20260227121142_f586c6f0-36ad-4058-925f-51376bd92648.sql
-- ----------------------------------------------------------------------------
-- Site settings table for bank details etc.
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON public.site_settings FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete settings" ON public.site_settings FOR DELETE USING (is_admin(auth.uid()));

-- Insert default bank details
INSERT INTO public.site_settings (key, value) VALUES (
  'bank_details',
  '{"bank_name": "First Bank of Nigeria", "account_number": "0123456789", "account_name": "ISM Prayer Network"}'::jsonb
);

-- Purchase orders table for POP-based orders
CREATE TABLE public.purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  pop_image_url text,
  espees_code text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.purchase_orders FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Authenticated users can create orders" ON public.purchase_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders" ON public.purchase_orders FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete orders" ON public.purchase_orders FOR DELETE USING (is_admin(auth.uid()));

-- Storage bucket for POP uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('pop-uploads', 'pop-uploads', true);

CREATE POLICY "Auth users can upload POP" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pop-uploads' AND auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view POP" ON storage.objects FOR SELECT USING (bucket_id = 'pop-uploads');

-- ----------------------------------------------------------------------------
-- Migration: 20260227133820_85bbe20c-c778-4c0a-b08a-dc3a5591f9e4.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS subtitle text DEFAULT NULL;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS short_description text DEFAULT NULL;

-- ----------------------------------------------------------------------------
-- Migration: 20260303110537_de0bbc85-ce09-44a8-ba02-68ccddb3660e.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Migration: 20260303153713_2e3a3a29-b5b6-49d9-8205-645f7f66797e.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.books ADD COLUMN espees_price numeric NULL;
ALTER TABLE public.books ADD COLUMN ngn_price numeric NULL;

-- ----------------------------------------------------------------------------
-- Migration: 20260305095517_2fd5474b-edf1-4af2-8f77-1c50e5d5679b.sql
-- ----------------------------------------------------------------------------
CREATE TABLE public.combo_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  cover_image_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  espees_price NUMERIC,
  ngn_price NUMERIC,
  featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.combo_pack_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_pack_id UUID NOT NULL REFERENCES public.combo_packs(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  UNIQUE(combo_pack_id, book_id)
);

ALTER TABLE public.combo_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_pack_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active combo packs" ON public.combo_packs FOR SELECT USING (true);
CREATE POLICY "Admins can insert combo packs" ON public.combo_packs FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update combo packs" ON public.combo_packs FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete combo packs" ON public.combo_packs FOR DELETE USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view combo pack items" ON public.combo_pack_items FOR SELECT USING (true);
CREATE POLICY "Admins can insert combo pack items" ON public.combo_pack_items FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete combo pack items" ON public.combo_pack_items FOR DELETE USING (is_admin(auth.uid()));

CREATE TRIGGER update_combo_packs_updated_at BEFORE UPDATE ON public.combo_packs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Migration: 20260305103542_bb7ba9d5-373c-4f79-b157-5bd5f8a86abe.sql
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public uploads to book-covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-covers');

CREATE POLICY "Allow public read from book-covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');

-- ----------------------------------------------------------------------------
-- Migration: 20260306131237_1df0b712-1220-4c83-a4df-0e3a7282c278.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_email_exists(lookup_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = lookup_email
  );
$$;

-- ----------------------------------------------------------------------------
-- Migration: 20260307111243_02d14bf7-47da-4089-afdc-c85edb9f0a85.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.prayer_groups ADD COLUMN slug text UNIQUE;

-- Backfill existing groups with slugs based on their name
UPDATE public.prayer_groups SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 8);

-- Make slug NOT NULL after backfill
ALTER TABLE public.prayer_groups ALTER COLUMN slug SET NOT NULL;

-- ----------------------------------------------------------------------------
-- Migration: 20260307125917_afc49f67-4877-4345-84c3-a98f5bd8d889.sql
-- ----------------------------------------------------------------------------
-- Prayer slots scheduling table
CREATE TABLE public.prayer_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Minister',
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked',
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prayer_slots ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view slots (to see availability)
CREATE POLICY "Authenticated users can view all slots"
  ON public.prayer_slots FOR SELECT
  TO authenticated
  USING (true);

-- Users can book their own slots
CREATE POLICY "Users can book own slots"
  ON public.prayer_slots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own slots
CREATE POLICY "Users can delete own slots"
  ON public.prayer_slots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update own slots (for status changes)
CREATE POLICY "Users can update own slots"
  ON public.prayer_slots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all slots
CREATE POLICY "Admins can manage all slots"
  ON public.prayer_slots FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Enable realtime for live slot updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_slots;

-- Index for quick lookups
CREATE INDEX idx_prayer_slots_date_time ON public.prayer_slots (slot_date, slot_time);
CREATE INDEX idx_prayer_slots_user ON public.prayer_slots (user_id);
CREATE INDEX idx_prayer_slots_reminder ON public.prayer_slots (slot_date, slot_time, reminder_sent) WHERE status = 'booked' AND reminder_sent = false;

-- ----------------------------------------------------------------------------
-- Migration: 20260307140549_0749f13e-170d-4151-ade1-1c6e0432e77d.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.prayer_room_sessions ADD COLUMN timer_started_at timestamp with time zone DEFAULT NULL;

-- ----------------------------------------------------------------------------
-- Migration: 20260307140750_382871d4-6a1b-4200-a443-c34aac5fb66b.sql
-- ----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_room_sessions;

-- ----------------------------------------------------------------------------
-- Migration: 20260317153808_09ef8bc6-8419-4e91-8547-f330ed35e63c.sql
-- ----------------------------------------------------------------------------
-- Backfill: insert existing profiles into newsletter_subscribers (skip duplicates)
INSERT INTO public.newsletter_subscribers (email, full_name, is_active)
SELECT p.email, p.full_name, true
FROM public.profiles p
WHERE p.email IS NOT NULL AND p.email != ''
ON CONFLICT (email) DO NOTHING;

-- Create trigger function to auto-subscribe new users
CREATE OR REPLACE FUNCTION public.auto_subscribe_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    INSERT INTO public.newsletter_subscribers (email, full_name, is_active)
    VALUES (NEW.email, COALESCE(NEW.full_name, ''), true)
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS trg_auto_subscribe_new_user ON public.profiles;
CREATE TRIGGER trg_auto_subscribe_new_user
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_subscribe_new_user();

-- ----------------------------------------------------------------------------
-- Migration: 20260319215142_d557f8de-4564-4e32-8566-5c401741f6d3.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.programs ADD COLUMN video_url text DEFAULT NULL;

-- ----------------------------------------------------------------------------
-- Migration: 20260328122552_6fc79d56-4243-4a9b-a249-24f9b137383a.sql
-- ----------------------------------------------------------------------------
CREATE TABLE public.prayer_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  scripture TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active prayer points" ON public.prayer_points
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert prayer points" ON public.prayer_points
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update prayer points" ON public.prayer_points
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete prayer points" ON public.prayer_points
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Seed with existing hardcoded data
INSERT INTO public.prayer_points (category, title, scripture, body, sort_order) VALUES
('Healing Streams', 'PRAY CONCERNING TELEVISION AND RADIO BROADCAST', 'Romans 10:18 NKJV - "But I say, have they not heard? Yes indeed: ''Their sound has gone out to all the earth, and their words to the ends of the world''"', 'Thank God for the global broadcast of the Healing Streams Live Healing Services with Pastor Chris through television and radio networks around the world. Pray that every viewer and listener receives miracles, salvation, and restoration through every transmission.', 0),
('Healing Streams', 'PRAY FOR MIRACLES AND HEALING', 'Mark 16:18 - "They shall lay hands on the sick, and they shall recover."', 'Pray that as the word goes forth in the Healing Streams services, signs and wonders follow. Pray for creative miracles, divine healing, and total restoration for every participant.', 1),
('Nations & Leaders', 'PRAY FOR LEADERS OF NATIONS', '1 Timothy 2:1-2 - "I exhort therefore, that, first of all, supplications, prayers, intercessions, and giving of thanks, be made for all men; for kings, and for all that are in authority."', 'Pray for world leaders to make godly decisions. Pray for peace, justice, and righteousness in every nation. Pray against corruption and ungodly policies.', 2),
('Nations & Leaders', 'PRAY FOR OPEN DOORS IN RESTRICTED NATIONS', 'Revelation 3:8 - "I have set before thee an open door, and no man can shut it."', 'Pray for the gospel to penetrate nations where Christianity is restricted. Pray for boldness for ministers and believers in such regions.', 3),
('Ministers & Ministry', 'PRAY FOR MINISTERS OF THE GOSPEL', 'Ephesians 6:19 - "And for me, that utterance may be given unto me, that I may open my mouth boldly, to make known the mystery of the gospel."', 'Pray for every minister of the gospel to receive divine utterance and boldness. Pray for protection, provision, and increased anointing for all ISM ministers worldwide.', 4),
('Ministers & Ministry', 'PRAY FOR CHURCH GROWTH', 'Acts 2:47 - "And the Lord added to the church daily such as should be saved."', 'Pray for exponential growth in churches and ministries across the world. Pray that the harvest of souls continues unabated.', 5),
('Personal & Family', 'PRAY FOR YOUR FAMILY', 'Joshua 24:15 - "As for me and my house, we will serve the Lord."', 'Pray for salvation, unity, and divine protection over your family. Pray that every member of your household walks in the light of God''s word.', 6),
('Personal & Family', 'PRAY FOR SPIRITUAL GROWTH', '2 Peter 3:18 - "But grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ."', 'Pray for a deeper personal relationship with the Lord. Pray for wisdom, understanding, and spiritual maturity in your walk with God.', 7);

-- ----------------------------------------------------------------------------
-- Migration: 20260411181727_eb249f36-48f7-4684-8136-e1de3143fb82.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.programs ADD COLUMN registration_url text;

-- ----------------------------------------------------------------------------
-- Migration: 20260714195052_8f05408c-4fad-4b39-a30a-1cdc7c6f3254.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Migration: 20260714200700_3ec7af95-9319-4d7d-8cd0-8e8b094076be.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Migration: 20260730100947_4a1d3a4b-c3be-4225-8e1c-86d1f2b5f7d6.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Migration: 20260730104047_60b1a540-47db-44c0-bc7c-b5fa84456560.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_to_contacts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fname text;
  lname text;
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  fname := COALESCE(NULLIF(split_part(COALESCE(NEW.full_name, ''), ' ', 1), ''), split_part(NEW.email, '@', 1));
  lname := NULLIF(trim(substring(COALESCE(NEW.full_name, '') from position(' ' in COALESCE(NEW.full_name, '')) + 1)), '');
  IF NEW.full_name IS NULL OR position(' ' in NEW.full_name) = 0 THEN
    lname := '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.contacts c WHERE lower(c.email) = lower(NEW.email)) THEN
    INSERT INTO public.contacts (first_name, last_name, email, source)
    VALUES (fname, COALESCE(lname, ''), lower(NEW.email), 'platform_signup');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_to_contacts_trigger ON public.profiles;
CREATE TRIGGER sync_profile_to_contacts_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_contacts();

-- ----------------------------------------------------------------------------
-- Migration: 20260730104505_ceece73e-d550-4a2a-a38e-83cf6721ff5d.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, ministry_name, dob_day, dob_month, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'stacomzy20@gmail.com' THEN 'super-admin' ELSE 'customer' END,
    COALESCE(NEW.raw_user_meta_data->>'ministry_name', ''),
    (NEW.raw_user_meta_data->>'dob_day')::integer,
    (NEW.raw_user_meta_data->>'dob_month')::integer,
    NULLIF(NEW.raw_user_meta_data->>'country', '')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_profile_to_contacts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fname text;
  lname text;
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  fname := COALESCE(NULLIF(split_part(COALESCE(NEW.full_name, ''), ' ', 1), ''), split_part(NEW.email, '@', 1));
  IF NEW.full_name IS NULL OR position(' ' in NEW.full_name) = 0 THEN
    lname := '';
  ELSE
    lname := COALESCE(NULLIF(trim(substring(NEW.full_name from position(' ' in NEW.full_name) + 1)), ''), '');
  END IF;

  IF EXISTS (SELECT 1 FROM public.contacts c WHERE lower(c.email) = lower(NEW.email)) THEN
    UPDATE public.contacts c
    SET first_name = CASE WHEN COALESCE(c.first_name, '') = '' THEN fname ELSE c.first_name END,
        last_name  = CASE WHEN COALESCE(c.last_name, '') = '' THEN lname ELSE c.last_name END,
        country    = COALESCE(NULLIF(NEW.country, ''), c.country),
        updated_at = now()
    WHERE lower(c.email) = lower(NEW.email);
  ELSE
    INSERT INTO public.contacts (first_name, last_name, email, country, source)
    VALUES (fname, lname, lower(NEW.email), NULLIF(NEW.country, ''), 'platform_signup');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_to_contacts_trigger ON public.profiles;
CREATE TRIGGER sync_profile_to_contacts_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_contacts();

DROP TRIGGER IF EXISTS sync_profile_update_to_contacts_trigger ON public.profiles;
CREATE TRIGGER sync_profile_update_to_contacts_trigger
AFTER UPDATE OF full_name, country, email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_contacts();

-- ----------------------------------------------------------------------------
-- Migration: 20260730110644_6f2c963c-1283-4372-a799-1d1af959bce7.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.prayer_points ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  category text NOT NULL DEFAULT 'general',
  published_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.prayer_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  minister_name text NOT NULL,
  church text NOT NULL,
  prayer_date date NOT NULL,
  attendance integer NOT NULL DEFAULT 0,
  notes text,
  file_url text,
  file_name text,
  contact_email text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prayer_reports TO authenticated;
GRANT ALL ON public.prayer_reports TO service_role;

ALTER TABLE public.prayer_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit reports" ON public.prayer_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own reports, admins view all" ON public.prayer_reports FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can update reports" ON public.prayer_reports FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete reports" ON public.prayer_reports FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_prayer_reports_updated_at BEFORE UPDATE ON public.prayer_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Migration: 20260730110713_fef0b887-396f-4680-a593-ab2cb7c37633.sql
-- ----------------------------------------------------------------------------
CREATE POLICY "Users upload own report files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own report files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'report-uploads' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));

-- ----------------------------------------------------------------------------
-- Migration: 20260810133551_d1a9696e-219c-408b-af7c-ae8ea7a8553f.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Migration: 20260810134528_8c635a84-4e49-4d06-8ed4-64713532d5f6.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NULL;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://ryitxoymayasdlabojsx.supabase.co/functions/v1/send-transactional-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := jsonb_build_object(
        'templateName', 'welcome-signup',
        'recipientEmail', NEW.email,
        'idempotencyKey', 'welcome-signup-' || NEW.id::text,
        'templateData', jsonb_build_object(
          'fullName', COALESCE(NEW.full_name, ''),
          'ministryName', COALESCE(NEW.ministry_name, '')
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'send_welcome_email_on_signup failed: %', SQLERRM;
  END;

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_send_welcome_email ON public.profiles;

CREATE TRIGGER trg_send_welcome_email
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.send_welcome_email_on_signup();

-- ----------------------------------------------------------------------------
-- Migration: 20260810141332_ebc73726-ac57-4081-9e9f-bdbaeca346ea.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Migration: 20260817155532_d07b79fc-55ca-4ef4-9cee-0cf665b5783b.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS ministerial_role text,
  ADD COLUMN IF NOT EXISTS city text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, ministry_name, dob_day, dob_month, country, phone, title, ministerial_role, city)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'stacomzy20@gmail.com' THEN 'super-admin' ELSE 'customer' END,
    COALESCE(NEW.raw_user_meta_data->>'ministry_name', ''),
    (NEW.raw_user_meta_data->>'dob_day')::integer,
    (NEW.raw_user_meta_data->>'dob_month')::integer,
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'title', ''),
    NULLIF(NEW.raw_user_meta_data->>'ministerial_role', ''),
    NULLIF(NEW.raw_user_meta_data->>'city', '')
  );
  RETURN NEW;
END;
$function$;

-- ----------------------------------------------------------------------------
-- Migration: 20260817163951_1612c5f4-369b-4aaf-b2b5-2f96c71e21d0.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS ministerial_role text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS dob_day integer,
  ADD COLUMN IF NOT EXISTS dob_month integer;

-- ----------------------------------------------------------------------------
-- Migration: 20260817165657_d59f41f1-6f7a-408f-9554-155cc478849b.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Migration: 20260914133310_de6234bb-4d93-47fb-a554-f692d0f6a84e.sql
-- ----------------------------------------------------------------------------
ALTER TABLE public.prayer_requests
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS response_text text,
  ADD COLUMN IF NOT EXISTS responded_by uuid,
  ADD COLUMN IF NOT EXISTS responded_at timestamp with time zone;

CREATE OR REPLACE FUNCTION public.validate_prayer_request_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('submitted','praying','answered') THEN
    RAISE EXCEPTION 'Invalid prayer request status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_prayer_request_status ON public.prayer_requests;
CREATE TRIGGER trg_validate_prayer_request_status
BEFORE INSERT OR UPDATE ON public.prayer_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_prayer_request_status();

DROP POLICY IF EXISTS "Coordinators can update prayer requests" ON public.prayer_requests;
CREATE POLICY "Coordinators can update prayer requests"
ON public.prayer_requests FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.testimonies
  ADD COLUMN IF NOT EXISTS prayer_request_id uuid REFERENCES public.prayer_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_testimonies_prayer_request_id ON public.testimonies(prayer_request_id);

DROP POLICY IF EXISTS "Request owners can share linked testimonies" ON public.testimonies;
CREATE POLICY "Request owners can share linked testimonies"
ON public.testimonies FOR INSERT TO authenticated
WITH CHECK (
  prayer_request_id IS NULL
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.prayer_requests pr
    WHERE pr.id = prayer_request_id AND pr.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- Migration: 20261005104302_f48ecdfa-fa10-4b45-af02-0f2a074864fd.sql
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'move_to_dlq') THEN
    ALTER FUNCTION public.move_to_dlq(text,text,bigint,jsonb) SET search_path = public, pgmq;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'read_email_batch') THEN
    ALTER FUNCTION public.read_email_batch(text,integer,integer) SET search_path = public, pgmq;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'enqueue_email') THEN
    ALTER FUNCTION public.enqueue_email(text,jsonb) SET search_path = public, pgmq;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_email') THEN
    ALTER FUNCTION public.delete_email(text,bigint) SET search_path = public, pgmq;
  END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated users can submit prayer requests" ON public.prayer_requests;
CREATE POLICY "Authenticated users can submit prayer requests" ON public.prayer_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can submit testimonies" ON public.testimonies;
CREATE POLICY "Authenticated users can submit testimonies" ON public.testimonies
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Hide other members' emails on prayer slots
REVOKE SELECT ON public.prayer_slots FROM authenticated, anon;
GRANT SELECT (id, user_id, user_name, slot_date, slot_time, status, reminder_sent, created_at) ON public.prayer_slots TO authenticated;

-- Storage
DROP POLICY IF EXISTS "Allow public uploads to book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view POP" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload POP" ON storage.objects;
CREATE POLICY "Users upload own POP" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pop-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners and admins view POP" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pop-uploads' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));

-- ----------------------------------------------------------------------------
-- INITIAL STORAGE BUCKET SEEDS & SITE SETTINGS SEEDS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('book-covers', 'book-covers', true),
  ('pop-uploads', 'pop-uploads', false),
  ('report-uploads', 'report-uploads', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Default site settings for Live TV and bank details
INSERT INTO public.site_settings (key, value) VALUES
  ('hls_url', to_jsonb('https://netshiftstudiokit.online:5443/LiveApp/streams/mopc_main.m3u8'::text)),
  ('bank_details', '{"bank_name": "First Bank of Nigeria", "account_number": "0123456789", "account_name": "ISM Prayer Network"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
