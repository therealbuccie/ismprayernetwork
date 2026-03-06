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

const todaysPrayerPoint = {
  date: new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  title: "PRAY CONCERNING TELEVISION AND RADIO BROADCAST OF THE HEALING STREAMS",
  scripture:
    "Romans 10:18 NKJV - \"But I say, have they not heard? Yes indeed: 'Their sound has gone out to all the earth, and their words to the ends of the world'\"",
  body: "Thank God for the global broadcast of the Healing Streams Live Healing Services with Pastor Chris through television and radio networks around the world. Pray that every viewer and listener receives miracles, salvation, and restoration through every transmission. Pray that the signals are clear and unhindered, reaching every language, territory, and nation.",
};

const BASE_URL = "https://ismprayernetwork.org";

const ministersPraying = [
  { id: 1, name: "Pastor Grace", location: "Lagos" },
  { id: 2, name: "Minister Daniel", location: "Nairobi" },
  { id: 3, name: "Dcn. Sarah", location: "London" },
  { id: 4, name: "Pastor James", location: "Accra" },
  { id: 5, name: "Sister Faith", location: "Houston" },
  { id: 6, name: "Brother Paul", location: "Toronto" },
  { id: 7, name: "Pastor Mary", location: "Johannesburg" },
  { id: 8, name: "Minister Tunde", location: "Abuja" },
];

const PrayerRoom = () => {
  const [copied, setCopied] = useState(false);
  const [giveModalOpen, setGiveModalOpen] = useState(false);
  const [prayerText, setPrayerText] = useState("");
  const [submittingPrayer, setSubmittingPrayer] = useState(false);
  const [mySessionSlug, setMySessionSlug] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user, profile, loading } = useAuth();
  const queryClient = useQueryClient();
  const [showAuthModal, setShowAuthModal] = useState(!user);

  // Update auth modal when user state changes
  useEffect(() => {
    if (user) setShowAuthModal(false);
  }, [user]);

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

  // Auto-create the user's prayer session based on their name
  useEffect(() => {
    if (!user) {
      console.log("Prayer session: no user");
      return;
    }
    console.log("Prayer session: user found", user.id, "profile:", profile?.full_name);
    const fetchOrCreateSession = async () => {
      // Check for existing session
      const { data, error: fetchError } = await supabase
        .from("prayer_room_sessions")
        .select("slug")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();
      console.log("Prayer session fetch:", data, fetchError);
      if (data) {
        setMySessionSlug(data.slug);
        return;
      }
      // Auto-create one using their name (or email fallback)
      const displayName = profile?.full_name || user.email?.split("@")[0] || "minister";
      const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      console.log("Creating prayer session with slug:", slug);
      const { error } = await supabase.from("prayer_room_sessions").insert({
        slug,
        owner_id: user.id,
        owner_name: profile?.full_name || displayName,
      });
      console.log("Insert result:", error);
      if (error) {
        // If slug conflict, append a short suffix
        const uniqueSlug = `${slug}-${Date.now().toString(36).slice(-4)}`;
        const { error: error2 } = await supabase.from("prayer_room_sessions").insert({
          slug: uniqueSlug,
          owner_id: user.id,
          owner_name: profile?.full_name || displayName,
        });
        console.log("Fallback insert:", uniqueSlug, error2);
        if (!error2) setMySessionSlug(uniqueSlug);
      } else {
        setMySessionSlug(slug);
      }
    };
    fetchOrCreateSession();
  }, [user, profile?.full_name]);

  const shareUrl = mySessionSlug
    ? `${BASE_URL}/prayer-room/${mySessionSlug}`
    : `${BASE_URL}/prayer-room`;

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Video/Prayer Embed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 flex flex-col"
          >
            <div className="glass-card rounded-xl overflow-hidden flex-1 min-h-[500px] lg:min-h-[600px]">
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
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
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
            </div>

            {/* Unique Prayer Link */}
            <div className="mt-4">
              {mySessionSlug ? (
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
              ) : (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Sign in to get your unique prayer link to share with loved ones.
                </p>
              )}
            </div>

            {/* Participants who joined via your link */}
            {participants && participants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 glass-card rounded-xl p-4 border border-accent/30"
              >
                <h3 className="font-serif font-semibold text-sm mb-3 flex items-center gap-2">
                  <Users size={16} className="text-accent" />
                  Joined Your Prayer ({participants.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <AnimatePresence>
                    {participants.map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium text-foreground">{p.full_name}</span>
                        <span className="text-xs text-muted-foreground">{p.location || ""}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-4"
          >
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
            <div className="glass-card rounded-xl p-5 border border-border/50">
              <h3 className="font-serif font-semibold text-sm mb-3">Prayer Room Info</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>🔥 24/7 Non-stop prayer sessions</p>
                <p>🌍 Ministers from around the world</p>
                <p>🎥 Live video & audio prayer</p>
                <p>📖 Daily prayer points updated</p>
              </div>
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
            {ministersPraying.map((minister) => (
              <div
                key={minister.id}
                className="flex-shrink-0 w-40 glass-card rounded-xl p-4 border border-border/50 flex flex-col items-center gap-3 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <Users size={28} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{minister.name}</p>
                  <p className="text-xs text-muted-foreground">{minister.location}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs rounded-full px-4"
                >
                  Pray Now
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
    </div>
  );
};

export default PrayerRoom;
