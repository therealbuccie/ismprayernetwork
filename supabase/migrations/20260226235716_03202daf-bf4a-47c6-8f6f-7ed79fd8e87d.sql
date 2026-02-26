
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
