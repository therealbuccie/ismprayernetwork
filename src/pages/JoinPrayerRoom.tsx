import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Users, MapPin, ArrowRight, Radio, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Hls from "hls.js";

const JoinPrayerRoom = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
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

  // Fetch participants for this session
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

  // Realtime subscription for participant updates
  useEffect(() => {
    if (!session?.id) return;
    const channel = supabase
      .channel(`join-prayer-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "prayer_room_participants",
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["session-participants", session.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id, queryClient]);

  // HLS player setup
  useEffect(() => {
    if (!hasJoined || !hlsUrl) return;
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLive(true);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setIsLive(false);
      });
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLive(true);
        video.play().catch(() => {});
      });
    }
  }, [hasJoined, hlsUrl]);

  const handleJoin = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!session) return;
    setJoining(true);
    try {
      const { error } = await supabase.from("prayer_room_participants").insert({
        session_id: session.id,
        full_name: fullName.trim(),
        location: location.trim() || null,
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

  // After joining — show Live TV + participants
  if (hasJoined) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        {/* Decorative glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-accent/5 blur-[150px]" />
        </div>

        <div className="relative z-10 pt-18 pb-10 flex-1">
          <div className="container mx-auto px-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-4"
            >
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
                Praying with{" "}
                <span className="gold-gradient">{session.owner_name}</span>
              </h1>
              <p className="text-muted-foreground text-xs md:text-sm">
                You're connected — watch the live stream and pray together.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-accent/10 bg-card">
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-accent/20 via-transparent to-accent/10 pointer-events-none z-10" />
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
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

                {/* Action buttons */}
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate("/partner")}
                  >
                    <Heart size={14} /> Give / Partner
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
                    <Share2 size={14} /> Share
                  </Button>
                </div>
              </motion.div>

              {/* Sidebar: Participants */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-4"
              >
                {/* Praying with card */}
                <div className="glass-card rounded-xl p-5 border border-accent/30">
                  <h3 className="font-serif font-semibold text-sm mb-3 flex items-center gap-2">
                    <Users size={16} className="text-accent" />
                    People Praying ({participants?.length ?? 0})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <AnimatePresence>
                      {participants?.map((p) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3"
                        >
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
                      <p className="text-xs text-muted-foreground text-center py-4">
                        You're the first to join! 🙏
                      </p>
                    )}
                  </div>
                </div>

                {/* Session info */}
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

                {/* Prayer Room Info */}
                <div className="glass-card rounded-xl p-5 border border-border/50">
                  <h3 className="font-serif font-semibold text-sm mb-3">Prayer Room Info</h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>🔥 24/7 Non-stop prayer sessions</p>
                    <p>🌍 Ministers from around the world</p>
                    <p>🎥 Live broadcast streaming</p>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card rounded-2xl p-8 border border-border/50 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-5">
              <Flame size={32} className="text-accent" />
            </div>
            <h1 className="text-xl font-serif font-bold text-foreground mb-1">
              Join in Prayer
            </h1>
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
                <Label htmlFor="location" className="text-sm font-medium">Location (optional)</Label>
                <div className="relative mt-1">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g. Lagos, Nigeria"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2 mt-2"
              >
                <Users size={16} /> {joining ? "Joining..." : "Join Prayer Session"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default JoinPrayerRoom;
