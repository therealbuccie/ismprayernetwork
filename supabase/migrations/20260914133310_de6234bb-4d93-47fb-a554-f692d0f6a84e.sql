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