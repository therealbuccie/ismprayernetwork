
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
