
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
