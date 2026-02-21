
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
