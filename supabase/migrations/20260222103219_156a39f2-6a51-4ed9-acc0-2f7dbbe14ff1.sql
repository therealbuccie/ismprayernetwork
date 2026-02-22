
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
