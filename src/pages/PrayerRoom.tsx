import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Heart, BookOpen, Share2, Copy, Check, Users, Send } from "lucide-react";
import { HeroButton } from "@/components/HeroButton";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AuthGateModal from "@/components/AuthGateModal";
import PrayerSchedule from "@/components/prayer-schedule/PrayerSchedule";
import PrayerTimer from "@/components/prayer-schedule/PrayerTimer";

const todaysDate = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const FALLBACK_BASE_URL = "https://ismprayernetwork.org";


const PrayerRoom = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [giveModalOpen, setGiveModalOpen] = useState(false);
  const [prayerText, setPrayerText] = useState("");
  const [submittingPrayer, setSubmittingPrayer] = useState(false);
  const [mySessionSlug, setMySessionSlug] = useState<string | null>(null);
  const [isPreparingSessionLink, setIsPreparingSessionLink] = useState(false);
  const [isPraying, setIsPraying] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user, profile, loading } = useAuth();
  const queryClient = useQueryClient();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: todaysPrayerPoint } = useQuery({
    queryKey: ["prayer-points-room"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_points")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setShowAuthModal(!loading && !user);
  }, [loading, user]);

  const { data: requests } = useQuery({
    queryKey: ["prayer-room-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: testimonies } = useQuery({
    queryKey: ["prayer-room-testimonies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonies")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Fetch people currently praying (today's prayer slots)
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: prayingNow } = useQuery({
    queryKey: ["praying-now", todayStr],
    queryFn: async () => {
      const { data: slots, error } = await supabase
        .from("prayer_slots")
        .select("id, user_id, user_name, slot_time")
        .eq("slot_date", todayStr)
        .eq("status", "booked")
        .order("slot_time", { ascending: true });
      if (error) throw error;
      if (!slots || slots.length === 0) return [];

      // Fetch profiles for ministry_name
      const userIds = [...new Set(slots.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, ministry_name")
        .in("user_id", userIds);

      // Fetch prayer room sessions for slugs
      const { data: sessions } = await supabase
        .from("prayer_room_sessions")
        .select("owner_id, slug")
        .in("owner_id", userIds)
        .eq("is_active", true);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const sessionMap = new Map(sessions?.map(s => [s.owner_id, s.slug]) || []);

      // Deduplicate by user_id, keep first slot
      const seen = new Set<string>();
      return slots.filter(s => {
        if (seen.has(s.user_id)) return false;
        seen.add(s.user_id);
        return true;
      }).map(s => {
        const prof = profileMap.get(s.user_id);
        return {
          id: s.id,
          name: prof?.full_name || s.user_name,
          ministry: prof?.ministry_name || null,
          user_id: s.user_id,
          slug: sessionMap.get(s.user_id) || null,
          isSample: false,
        };
      });
    },
    refetchInterval: 30000, // refresh every 30s
  });

  // Sample ministers always shown, plus real ones
  const sampleMinisters = [
    { id: "sample-1", name: "Min. Grace Okafor", ministry: "Grace Tabernacle", user_id: "sample-1", slug: null, isSample: true },
    { id: "sample-2", name: "Pst. David Mensah", ministry: "House of Glory", user_id: "sample-2", slug: null, isSample: true },
    { id: "sample-3", name: "Evg. Ruth Kimani", ministry: "Fire & Light Ministry", user_id: "sample-3", slug: null, isSample: true },
    { id: "sample-4", name: "Dcns. Blessing Eze", ministry: "Kingdom Embassy", user_id: "sample-4", slug: null, isSample: true },
  ];

  const allPrayingNow = [
    ...(prayingNow || []),
    ...sampleMinisters.filter(s => !(prayingNow || []).some(r => r.name === s.name)),
  ];

  // Auto-create the user's prayer session based on their name
  useEffect(() => {
    let isMounted = true;

    const fetchOrCreateSession = async () => {
      if (loading) return;
      if (!user) {
        if (isMounted) {
          setMySessionSlug(null);
          setIsPreparingSessionLink(false);
        }
        return;
      }

      setIsPreparingSessionLink(true);

      try {
        const { data: existingSessions, error: fetchError } = await supabase
          .from("prayer_room_sessions")
          .select("slug")
          .eq("owner_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        const existingSlug = existingSessions?.[0]?.slug;
        if (existingSlug) {
          if (isMounted) setMySessionSlug(existingSlug);
          return;
        }

        const displayName =
          (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
          user.email?.split("@")[0] ||
          "minister";
        const normalizedSlug = displayName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        const { data: createdSession, error: createError } = await supabase
          .from("prayer_room_sessions")
          .insert({
            slug: normalizedSlug,
            owner_id: user.id,
            owner_name: displayName,
          })
          .select("slug")
          .single();

        if (createError) {
          const uniqueSlug = `${normalizedSlug}-${Date.now().toString(36).slice(-4)}`;
          const { data: fallbackSession, error: fallbackError } = await supabase
            .from("prayer_room_sessions")
            .insert({
              slug: uniqueSlug,
              owner_id: user.id,
              owner_name: displayName,
            })
            .select("slug")
            .single();

          if (fallbackError) throw fallbackError;
          if (isMounted) setMySessionSlug(fallbackSession.slug);
          return;
        }

        if (isMounted) setMySessionSlug(createdSession.slug);
      } catch (error) {
        console.error("Prayer session link generation failed:", error);
        if (isMounted) {
          setMySessionSlug(null);
          toast.error("Couldn't generate your prayer link. Please refresh and try again.");
        }
      } finally {
        if (isMounted) setIsPreparingSessionLink(false);
      }
    };

    fetchOrCreateSession();

    return () => {
      isMounted = false;
    };
  }, [loading, user?.id]);

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : FALLBACK_BASE_URL;
  const shareUrl = mySessionSlug
    ? `${currentOrigin}/prayer-room/${mySessionSlug}`
    : `${currentOrigin}/prayer-room`;

  // Query participants for current session
  const { data: mySession } = useQuery({
    queryKey: ["my-prayer-session", mySessionSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("prayer_room_sessions")
        .select("id")
        .eq("slug", mySessionSlug!)
        .single();
      return data;
    },
    enabled: !!mySessionSlug,
  });

  const { data: participants } = useQuery({
    queryKey: ["session-participants", mySession?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("prayer_room_participants")
        .select("*")
        .eq("session_id", mySession!.id)
        .order("joined_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!mySession?.id,
  });

  // Realtime subscription for new participants
  useEffect(() => {
    if (!mySession?.id) return;
    const channel = supabase
      .channel("prayer-participants")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "prayer_room_participants",
          filter: `session_id=eq.${mySession.id}`,
        },
        (payload) => {
          const p = payload.new as any;
          toast.success(`${p.full_name} joined your prayer! 🙏`);
          queryClient.invalidateQueries({ queryKey: ["session-participants", mySession.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [mySession?.id, queryClient]);

  // When host starts praying, set timer_started_at on their session
  const startHostTimer = async () => {
    setIsPraying(true);
    if (mySessionSlug) {
      await supabase
        .from("prayer_room_sessions")
        .update({ timer_started_at: new Date().toISOString() } as any)
        .eq("slug", mySessionSlug);
    }
  };

  const stopHostTimer = async () => {
    setIsPraying(false);
    if (mySessionSlug) {
      await supabase
        .from("prayer_room_sessions")
        .update({ timer_started_at: null } as any)
        .eq("slug", mySessionSlug);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmitPrayer = async () => {
    if (!prayerText.trim()) {
      toast.error("Please type your prayer request");
      return;
    }
    if (!user) {
      toast.error("Please sign in to submit a prayer request");
      return;
    }
    setSubmittingPrayer(true);
    try {
      const { error } = await supabase.from("prayer_requests").insert({
        title: prayerText.trim(),
        category: "General",
        author_name: profile?.full_name || "Anonymous",
        user_id: user.id,
      });
      if (error) throw error;
      toast.success("Prayer request submitted! 🙏");
      setPrayerText("");
      queryClient.invalidateQueries({ queryKey: ["prayer-room-requests"] });
      queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingPrayer(false);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header Banner */}
      <div className="pt-16">
        <div className="hero-gradient py-4 px-4">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <div>
              <h1 className="text-lg md:text-xl font-serif font-bold text-primary-foreground flex items-center gap-2">
                <Flame size={20} className="text-accent" />
                Welcome to the ISM Prayer <span className="gold-gradient">Room</span>
              </h1>
              <p className="text-primary-foreground/70 text-xs md:text-sm">Hosted by ISM Ministers Prayer Network</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {isPraying ? (
            /* ===== ACTIVE PRAYER SESSION ===== */
            <motion.div
              key="praying"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left: Prayer Room + timer above */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Compact timer bar above the room */}
                <div className="flex items-center justify-center">
                  <PrayerTimer
                    onComplete={() => stopHostTimer()}
                    onBack={() => stopHostTimer()}
                  />
                </div>

                {/* Video Embed — full space */}
                <div className="glass-card rounded-xl overflow-hidden min-h-[500px] lg:min-h-[600px]">
                  <iframe
                    src="https://jcontrol.pro/join?session=ism-prayer-network"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: "none", borderRadius: "8px", minHeight: "500px" }}
                    allow="camera; microphone; autoplay; encrypted-media"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <HeroButton
                    variant="outline"
                    size="sm"
                    className="text-foreground border-border hover:bg-muted gap-1.5"
                    onClick={() => setGiveModalOpen(true)}
                  >
                    <Heart size={14} /> Give Now
                  </HeroButton>
                  <HeroButton variant="gold" size="sm" className="gap-1.5" onClick={scrollToBottom}>
                    <BookOpen size={14} /> Prayer Requests
                  </HeroButton>
                </div>

                {/* Share Link */}
                {mySessionSlug && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 glass-card rounded-lg px-3 py-2 text-xs text-muted-foreground truncate border border-border/50">
                      {shareUrl}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied!" : "Share Link"}
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: "ISM Prayer Room", url: shareUrl });
                        }
                      }}
                      className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <Share2 size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="flex flex-col gap-4">
                {/* Today's Prayer Point */}
                <div className="glass-card rounded-xl p-5 border border-border/50">
                  <div className="bg-accent/10 rounded-lg p-3 mb-4 text-center">
                    <h2 className="text-lg font-serif font-bold text-accent">Today's Prayer Point</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                    📅 {todaysDate}
                  </p>
                  {todaysPrayerPoint ? (
                    <>
                      <h3 className="font-serif font-bold text-sm mb-3 text-foreground leading-snug">
                        {todaysPrayerPoint.title}
                      </h3>
                      <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed border-l-2 border-accent/50 pl-3">
                        {todaysPrayerPoint.scripture}
                      </p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{todaysPrayerPoint.body}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No prayer point available.</p>
                  )}
                </div>

                {/* Participants */}
                {participants && participants.length > 0 && (
                  <div className="glass-card rounded-xl p-4 border border-accent/30">
                    <h3 className="font-serif font-semibold text-sm mb-3 flex items-center gap-2">
                      <Users size={16} className="text-accent" />
                      Joined Your Prayer ({participants.length})
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {participants.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{p.full_name}</span>
                          <span className="text-xs text-muted-foreground">{p.location || ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* ===== SCHEDULE VIEW ===== */
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Schedule */}
                <div className="lg:col-span-2">
                  <PrayerSchedule onStartPraying={() => startHostTimer()} />
                </div>

                {/* Right Sidebar */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex flex-col gap-4"
                >
                  {/* Today's Prayer Point */}
                  <div className="glass-card rounded-xl p-5 border border-border/50">
                    <div className="bg-accent/10 rounded-lg p-3 mb-4 text-center">
                      <h2 className="text-lg font-serif font-bold text-accent">Today's Prayer Point</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                      📅 {todaysPrayerPoint.date}
                    </p>
                    <h3 className="font-serif font-bold text-sm mb-3 text-foreground leading-snug">
                      {todaysPrayerPoint.title}
                    </h3>
                    <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed border-l-2 border-accent/50 pl-3">
                      {todaysPrayerPoint.scripture}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{todaysPrayerPoint.body}</p>
                  </div>

                  {/* Prayer Room Info */}
                  <div className="glass-card rounded-xl p-5 border border-border/50">
                    <h3 className="font-serif font-semibold text-sm mb-3">How It Works</h3>
                    <div className="space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <span className="text-accent font-bold text-sm">1</span>
                        <p>Pick a date and choose your preferred 15-minute prayer slot</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent font-bold text-sm">2</span>
                        <p>You'll receive an email reminder 30 minutes before your slot</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent font-bold text-sm">3</span>
                        <p>When it's time, click "Start Praying" to enter the prayer room</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent font-bold text-sm">4</span>
                        <p>Pray for 15 minutes with the live prayer room & timer</p>
                      </div>
                    </div>
                  </div>

                  {/* Share Link */}
                  <div className="glass-card rounded-xl p-5 border border-border/50">
                    <h3 className="font-serif font-semibold text-sm mb-3">Invite Others</h3>
                    {mySessionSlug ? (
                      <div className="space-y-2">
                        <div className="glass-card rounded-lg px-3 py-2 text-xs text-muted-foreground truncate border border-border/50">
                          {shareUrl}
                        </div>
                        <button
                          onClick={handleCopy}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? "Copied!" : "Copy Prayer Link"}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {isPreparingSessionLink ? "Generating your prayer link..." : "Sign in to get your unique prayer link."}
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Ministers Praying Now */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-10"
              >
                <h2 className="text-center font-serif font-bold text-xl mb-6 tracking-wide uppercase">Praying Now</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {allPrayingNow.map((minister) => (
                      <div
                        key={minister.id}
                        className="flex-shrink-0 w-44 glass-card rounded-xl p-4 border border-border/50 flex flex-col items-center gap-3 text-center"
                      >
                        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                          <Users size={28} className="text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{minister.name}</p>
                          {minister.ministry && (
                            <p className="text-xs text-accent font-medium">{minister.ministry}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className={`text-xs rounded-full px-4 ${
                            minister.isSample
                              ? "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                          onClick={() => {
                            if (minister.isSample) {
                              toast.info("This room is full. Join another minister's prayer session!");
                            } else if (minister.slug) {
                              navigate(`/prayer-room/${minister.slug}`);
                            } else {
                              setIsPraying(true);
                            }
                          }}
                        >
                          {minister.isSample ? "Room Full" : "Join Prayer"}
                        </Button>
                      </div>
                    ))}
                </div>
              </motion.div>

              {/* Prayer Requests & Testimonies */}
              <motion.div
                ref={bottomRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-10 mb-8"
              >
                <h2 className="text-center font-serif font-bold text-xl mb-6 uppercase tracking-wide">
                  Prayer Requests & Testimonies
                </h2>

                <Tabs defaultValue="requests" className="w-full max-w-3xl mx-auto">
                  <TabsList className="mb-6">
                    <TabsTrigger value="requests">Prayer Requests</TabsTrigger>
                    <TabsTrigger value="testimonies">Testimonies</TabsTrigger>
                  </TabsList>

                  <TabsContent value="requests">
                    <div className="space-y-0 divide-y divide-border">
                      {requests?.length ? (
                        requests.map((req) => (
                          <div key={req.id} className="py-4">
                            <h4 className="font-serif font-semibold text-base">{req.author_name}</h4>
                            <p className="text-xs text-muted-foreground italic mb-1">Posted {timeAgo(req.created_at)}</p>
                            <p className="text-sm text-foreground/80">{req.title}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground py-4">No prayer requests yet.</p>
                      )}
                    </div>

                    <div className="mt-6">
                      <textarea
                        placeholder="Post Your Prayer Requests"
                        className="w-full border border-border rounded-lg p-3 text-sm bg-background text-foreground resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-accent"
                        value={prayerText}
                        onChange={(e) => setPrayerText(e.target.value)}
                      />
                      <Button
                        className="mt-3 gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2"
                        disabled={submittingPrayer}
                        onClick={handleSubmitPrayer}
                      >
                        <Send size={14} /> {submittingPrayer ? "Submitting..." : "Submit Prayer Request"}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="testimonies">
                    <div className="space-y-0 divide-y divide-border">
                      {testimonies?.length ? (
                        testimonies.map((testimony) => (
                          <div key={testimony.id} className="py-4">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-serif font-semibold text-base">{testimony.author_name}</h4>
                              {testimony.video_url && (
                                <span className="text-xs text-accent flex items-center gap-1">
                                  <Video size={12} /> Video
                                </span>
                              )}
                            </div>
                            {testimony.location && (
                              <p className="text-xs text-muted-foreground italic mb-1">{testimony.location}</p>
                            )}
                            <p className="text-sm text-foreground/80">"{testimony.content}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground py-4">No testimonies yet.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />

      {/* Give Now Modal */}
      <Dialog open={giveModalOpen} onOpenChange={setGiveModalOpen}>
        <DialogContent className="max-w-2xl h-[80vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2 font-serif">
              <Heart size={18} className="text-accent" /> Partner With Us
            </DialogTitle>
          </DialogHeader>
          <iframe
            src="https://christembassy-ism.org/onlinepay/seeds.php"
            title="Give to ISM Ministers Prayer Network"
            className="w-full flex-1 border-0"
            style={{ height: "calc(80vh - 60px)" }}
            allow="payment"
          />
        </DialogContent>
      </Dialog>
      <AuthGateModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Sign In to Prayer Room"
        description="Enter your email to join the prayer room"
      />
    </div>
  );
};

export default PrayerRoom;
