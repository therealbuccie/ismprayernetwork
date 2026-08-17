ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS ministerial_role text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS dob_day integer,
  ADD COLUMN IF NOT EXISTS dob_month integer;