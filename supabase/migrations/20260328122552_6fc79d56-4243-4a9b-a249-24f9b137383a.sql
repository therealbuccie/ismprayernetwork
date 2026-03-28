
CREATE TABLE public.prayer_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  scripture TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active prayer points" ON public.prayer_points
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert prayer points" ON public.prayer_points
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update prayer points" ON public.prayer_points
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete prayer points" ON public.prayer_points
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Seed with existing hardcoded data
INSERT INTO public.prayer_points (category, title, scripture, body, sort_order) VALUES
('Healing Streams', 'PRAY CONCERNING TELEVISION AND RADIO BROADCAST', 'Romans 10:18 NKJV - "But I say, have they not heard? Yes indeed: ''Their sound has gone out to all the earth, and their words to the ends of the world''"', 'Thank God for the global broadcast of the Healing Streams Live Healing Services with Pastor Chris through television and radio networks around the world. Pray that every viewer and listener receives miracles, salvation, and restoration through every transmission.', 0),
('Healing Streams', 'PRAY FOR MIRACLES AND HEALING', 'Mark 16:18 - "They shall lay hands on the sick, and they shall recover."', 'Pray that as the word goes forth in the Healing Streams services, signs and wonders follow. Pray for creative miracles, divine healing, and total restoration for every participant.', 1),
('Nations & Leaders', 'PRAY FOR LEADERS OF NATIONS', '1 Timothy 2:1-2 - "I exhort therefore, that, first of all, supplications, prayers, intercessions, and giving of thanks, be made for all men; for kings, and for all that are in authority."', 'Pray for world leaders to make godly decisions. Pray for peace, justice, and righteousness in every nation. Pray against corruption and ungodly policies.', 2),
('Nations & Leaders', 'PRAY FOR OPEN DOORS IN RESTRICTED NATIONS', 'Revelation 3:8 - "I have set before thee an open door, and no man can shut it."', 'Pray for the gospel to penetrate nations where Christianity is restricted. Pray for boldness for ministers and believers in such regions.', 3),
('Ministers & Ministry', 'PRAY FOR MINISTERS OF THE GOSPEL', 'Ephesians 6:19 - "And for me, that utterance may be given unto me, that I may open my mouth boldly, to make known the mystery of the gospel."', 'Pray for every minister of the gospel to receive divine utterance and boldness. Pray for protection, provision, and increased anointing for all ISM ministers worldwide.', 4),
('Ministers & Ministry', 'PRAY FOR CHURCH GROWTH', 'Acts 2:47 - "And the Lord added to the church daily such as should be saved."', 'Pray for exponential growth in churches and ministries across the world. Pray that the harvest of souls continues unabated.', 5),
('Personal & Family', 'PRAY FOR YOUR FAMILY', 'Joshua 24:15 - "As for me and my house, we will serve the Lord."', 'Pray for salvation, unity, and divine protection over your family. Pray that every member of your household walks in the light of God''s word.', 6),
('Personal & Family', 'PRAY FOR SPIRITUAL GROWTH', '2 Peter 3:18 - "But grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ."', 'Pray for a deeper personal relationship with the Lord. Pray for wisdom, understanding, and spiritual maturity in your walk with God.', 7);
