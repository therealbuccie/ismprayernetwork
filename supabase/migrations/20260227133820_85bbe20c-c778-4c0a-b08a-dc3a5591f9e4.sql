ALTER TABLE public.books ADD COLUMN IF NOT EXISTS subtitle text DEFAULT NULL;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS short_description text DEFAULT NULL;