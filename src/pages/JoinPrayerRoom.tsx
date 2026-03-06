import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Users, MapPin, Radio, Heart, Share2, Clock, CheckCircle2, Church } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Hls from "hls.js";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus",
  "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Democratic Republic of Congo", "Denmark", "Djibouti", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
  "Germany", "Ghana", "Greece", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libya", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
  "Malaysia", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico", "Moldova",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const PRAYER_DURATION = 15 * 60; // 15 minutes in seconds

const JoinPrayerRoom = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [ministry, setMinistry] = useState("");
  const [country, setCountry] = useState("");
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PRAYER_DURATION);
  const [completed, setCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLive, setIsLive] = useState(false);
  const queryClient = useQueryClient();

  const { data: hlsSetting } = useSiteSettings("hls_url");
  const hlsUrl = (hlsSetting as string) || "";

  const { data: session, isLoading, error } = useQuery({
    queryKey: ["prayer-session", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_room_sessions")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: participants } = useQuery({
    queryKey: ["session-participants", session?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("prayer_room_participants")
        .select("*")
        .eq("session_id", session!.id)
        .order("joined_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!session?.id,
  });

  // Realtime for participants
  useEffect(() => {
    if (!session?.id) return;
    const channel = supabase
      .channel(`join-prayer-${session.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "prayer_room_participants", filter: `session_id=eq.${session.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["session-participants", session.id] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id, queryClient]);

  // HLS player
  useEffect(() => {
    if (!hasJoined || !hlsUrl || completed) return;
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { setIsLive(true); video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) setIsLive(false); });
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => { setIsLive(true); video.play().catch(() => {}); });
    }
  }, [hasJoined, hlsUrl, completed]);

  // 15-minute countdown
  useEffect(() => {
    if (!hasJoined || completed) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasJoined, completed]);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const handleJoin = async () => {
    if (!fullName.trim()) { toast.error("Please enter your name"); return; }
    if (!country) { toast.error("Please select your country"); return; }
    if (!session) return;
    setJoining(true);
    try {
      const locationStr = country;
      const { error } = await supabase.from("prayer_room_participants").insert({
        session_id: session.id,
        full_name: fullName.trim(),
        location: locationStr,
      });
      if (error) throw error;
      setHasJoined(true);
      toast.success("You've joined the prayer! 🙏");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "ISM Prayer Room", url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading prayer room...</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Not found
  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <Flame size={48} className="text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Prayer Room Not Found</h1>
            <p className="text-muted-foreground mb-6">This prayer link may have expired or is invalid.</p>
            <Button onClick={() => navigate("/prayer-room")} className="gold-gradient-bg text-accent-foreground">
              Go to Prayer Room
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Completed state
  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-accent/8 blur-[120px]" />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-full max-w-lg text-center"
          >
            <div className="glass-card rounded-2xl p-10 border border-accent/30">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 size={40} className="text-accent" />
              </motion.div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
                🎉 Congratulations!
              </h1>
              <p className="text-lg text-foreground/80 mb-2">
                You have completed your prayer for today.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Thank you for praying with <span className="font-semibold text-foreground">{session.owner_name}</span>. God bless you!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleShare} variant="outline" className="gap-1.5">
                  <Share2 size={14} /> Share This Prayer Room
                </Button>
                <Button onClick={() => navigate("/")} className="gold-gradient-bg text-accent-foreground hover:opacity-90">
                  Back to Home
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // Praying state — LiveTV + countdown
  if (hasJoined) {
    const progress = ((PRAYER_DURATION - timeLeft) / PRAYER_DURATION) * 100;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-accent/5 blur-[150px]" />
        </div>

        <div className="relative z-10 pt-18 pb-10 flex-1">
          <div className="container mx-auto px-4">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-accent/30 bg-accent/10 mb-2"
              >
                <Radio size={14} className={`text-accent ${isLive ? "animate-pulse" : ""}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  {isLive ? "Live Now" : "Prayer Room"}
                </span>
              </motion.div>
              <h1 className="text-xl md:text-2xl font-serif font-bold mb-1">
                Praying with <span className="gold-gradient">{session.owner_name}</span>
              </h1>
            </motion.div>

            {/* Countdown Timer */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="max-w-md mx-auto mb-6"
            >
              <div className="glass-card rounded-xl p-4 border border-accent/30 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock size={18} className="text-accent" />
                  <span className="text-sm font-medium text-muted-foreground">Prayer Time Remaining</span>
                </div>
                <p className="text-4xl font-mono font-bold text-foreground tabular-nums">
                  {formatTime(timeLeft)}
                </p>
                <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full gold-gradient-bg rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
                <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-accent/10 bg-card">
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-accent/20 via-transparent to-accent/10 pointer-events-none z-10" />
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                    <video ref={videoRef} className="w-full h-full object-cover" controls playsInline />
                    {!isLive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                        <div className="text-center">
                          <Flame size={56} className="mx-auto mb-3 text-accent/40" />
                          <p className="text-foreground/80 font-medium">
                            {hlsUrl ? "Connecting to live stream…" : "Stream will begin shortly…"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/partner")}>
                    <Heart size={14} /> Give / Partner
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
                    <Share2 size={14} /> Share
                  </Button>
                </div>
              </motion.div>

              {/* Sidebar */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex flex-col gap-4">
                {/* Participants */}
                <div className="glass-card rounded-xl p-5 border border-accent/30">
                  <h3 className="font-serif font-semibold text-sm mb-3 flex items-center gap-2">
                    <Users size={16} className="text-accent" />
                    People Praying ({participants?.length ?? 0})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <AnimatePresence>
                      {participants?.map((p) => (
                        <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <Flame size={14} className="text-accent" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
                            {p.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin size={10} /> {p.location}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {(!participants || participants.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-4">You're the first to join! 🙏</p>
                    )}
                  </div>
                </div>

                {/* Session Host */}
                <div className="glass-card rounded-xl p-5 border border-border/50">
                  <h3 className="font-serif font-semibold text-sm mb-2">Session Host</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Flame size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{session.owner_name}</p>
                      <p className="text-xs text-muted-foreground">ISM Minister</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Join form
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="glass-card rounded-2xl p-8 border border-border/50 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-5">
              <Flame size={32} className="text-accent" />
            </div>
            <h1 className="text-xl font-serif font-bold text-foreground mb-1">Join in Prayer</h1>
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-semibold text-foreground">{session.owner_name}</span> has invited you to pray together in the ISM Prayer Room.
            </p>

            <div className="space-y-4 text-left">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Your Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ministry" className="text-sm font-medium">Ministry Name</Label>
                <div className="relative mt-1">
                  <Church size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="ministry"
                    placeholder="e.g. Christ Embassy"
                    value={ministry}
                    onChange={(e) => setMinistry(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Country *</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2 mt-2"
              >
                <Users size={16} /> {joining ? "Joining..." : "Start Praying"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              ⏱ A 15-minute prayer session will begin after you join.
            </p>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default JoinPrayerRoom;
