
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
