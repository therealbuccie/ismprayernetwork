
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
