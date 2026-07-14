import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Tv,
  Heart,
  MessageSquareHeart,
  Radio,
  Play,
  Bookmark,
  Clock,
  Users,
  Globe2,
  BookOpen,
  Mic,
  HandHeart,
  Sparkles,
  ChevronRight,
  Share2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import Hls from "hls.js";
import logo from "@/assets/logo.png";
import bannerPrayer from "@/assets/banner-prayer-network.png";
import bannerStandingGap from "@/assets/banner-standing-gap.png";
import bannerApp from "@/assets/banner-ism-app.png";
import bannerInside from "@/assets/banner-inside-ism.png";
import bannerMaster from "@/assets/banner-master-class.png";
import bannerSchool from "@/assets/banner-online-school.png";
import bannerLibrary from "@/assets/banner-digital-library.png";
import brandingJoin from "@/assets/branding-join.png";
import brandingHands from "@/assets/branding-prayer-hands.png";

const LiveTV = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLive, setIsLive] = useState(false);
  const { data: hlsSetting, isLoading: hlsLoading } = useSiteSettings("hls_url");

  const hlsUrl = (hlsSetting as string) || "";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLive(true);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
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
  }, [hlsUrl]);

  const featured = [
    { title: "Standing in the Gap", tag: "Prayers that change nations", time: "5:00 PM", img: bannerStandingGap, href: "/prayer-room" },
    { title: "Inside ISM", tag: "Ministry insights", time: "3:00 PM", img: bannerInside, href: "/programs" },
    { title: "Master Class", tag: "For Ministers", time: "7:00 PM", img: bannerMaster, href: "/programs" },
    { title: "Online School", tag: "Grow in the Word", time: "9:00 PM", img: bannerSchool, href: "/programs" },
    { title: "Digital Library", tag: "Read & study", time: "Anytime", img: bannerLibrary, href: "/bookstore" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-accent/5 blur-[160px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Top grid: left promo | player | right stack */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT — Live Service promo */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-accent/5 p-5 flex flex-col"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 self-start mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Live Now</span>
              </div>
              <h2 className="font-serif text-2xl leading-tight mb-2">
                Ministers Prayer Network<br />
                <span className="gold-gradient">Live Service</span>
              </h2>
              <p className="text-sm text-muted-foreground mb-5">A time of Prayer, Word, and Power!</p>

              <div className="flex flex-wrap gap-2 mb-5">
                <a href="#player" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold shadow-lg shadow-accent/30 hover:shadow-accent/50 transition">
                  <Play size={14} fill="currentColor" /> Watch Live
                </a>
                <Link to="/programs" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-muted/40 transition">
                  <Bookmark size={14} /> Watchlist
                </Link>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex -space-x-2">
                  {[brandingJoin, brandingHands, logo].map((src, i) => (
                    <img key={i} src={src} alt="" className="w-7 h-7 rounded-full border-2 border-card object-cover bg-muted" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">3.5K watching now</span>
              </div>

              <div className="mt-auto rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock size={12} /> Coming Up
                </div>
                <p className="text-xs text-muted-foreground">Today, 5:00 PM</p>
                <p className="font-semibold text-sm mt-0.5">Standing in the Gap</p>
                <p className="text-xs text-muted-foreground">Prayers that change nations</p>
              </div>
            </motion.aside>

            {/* CENTER — Player */}
            <motion.div
              id="player"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-6"
            >
              <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-2xl shadow-accent/10 bg-card">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-accent/20 via-transparent to-accent/10 pointer-events-none z-10" />
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                  <video ref={videoRef} className="w-full h-full object-cover" controls playsInline />
                  {isLive && (
                    <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-bold">
                      <Play size={10} fill="currentColor" /> LIVE
                    </div>
                  )}
                  {!isLive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                      <div className="text-center px-6">
                        <Tv size={56} className="mx-auto mb-3 text-accent/50" />
                        <p className="text-foreground/80 font-medium">
                          {hlsLoading ? "Loading stream…" : hlsUrl ? "Connecting to live stream…" : "No stream configured"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* RIGHT — Promo stack (in-platform CTAs) */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 flex flex-col gap-4"
            >
              {/* Stand Together in Prayer -> Prayer Requests */}
              <Link to="/prayer-requests" className="group relative rounded-2xl overflow-hidden border border-border/60 bg-card min-h-[170px] flex">
                <img src={brandingHands} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition" />
                <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-transparent" />
                <div className="relative p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg leading-tight">
                      STAND TOGETHER<br />
                      <span className="gold-gradient">IN PRAYER</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[180px]">
                      Join thousands of ministers praying for nations.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 self-start px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold">
                    Send a Prayer Request <ChevronRight size={12} />
                  </span>
                </div>
              </Link>

              {/* Prayer Groups (replaces "MPN App" ad) */}
              <Link to="/groups" className="group relative rounded-2xl overflow-hidden border border-border/60 bg-card min-h-[130px]">
                <img src={bannerPrayer} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
                <div className="relative p-4">
                  <h3 className="font-serif text-base leading-tight">Join a Prayer Group</h3>
                  <p className="text-xs text-muted-foreground mt-1">Pray. Share. Grow together.</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent">
                    Explore Groups <ChevronRight size={12} />
                  </span>
                </div>
              </Link>

              {/* Partner With Us */}
              <Link to="/partner" className="group relative rounded-2xl overflow-hidden border border-accent/30 bg-card min-h-[160px] flex">
                <img src={brandingJoin} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition" />
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background/80 to-background/95" />
                <div className="relative p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg leading-tight gold-gradient">PARTNER WITH US</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[180px]">
                      Be part of what God is doing through MPN around the world.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 self-start px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-md shadow-accent/30">
                    Give / Partner
                  </span>
                </div>
              </Link>
            </motion.aside>
          </div>

          {/* Featured Broadcasts */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-xl font-semibold">Featured Broadcasts</h2>
              <Link to="/programs" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                View All <ChevronRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {featured.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link
                    to={item.href}
                    className="group block relative rounded-xl overflow-hidden border border-border/60 aspect-[4/5] bg-card"
                  >
                    <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-bold text-white">
                      {item.time}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-semibold text-sm text-white leading-tight">{item.title}</h3>
                      <p className="text-[11px] text-white/70 mt-0.5">{item.tag}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom CTA row — all in-platform */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Link to="/testimonies" className="group rounded-xl border border-border/60 bg-gradient-to-br from-purple-500/10 to-transparent p-4 hover:border-accent/40 transition">
              <Mic size={22} className="text-purple-400 mb-2" />
              <h4 className="font-semibold text-sm">Submit a Testimony</h4>
              <p className="text-xs text-muted-foreground mt-1">Share how God has moved in your life.</p>
              <span className="text-xs text-accent mt-2 inline-flex items-center gap-1 font-semibold">Share Now <ChevronRight size={12} /></span>
            </Link>

            <Link to="/prayer-requests" className="group rounded-xl border border-border/60 bg-gradient-to-br from-accent/15 to-transparent p-4 hover:border-accent/40 transition">
              <HandHeart size={22} className="text-accent mb-2" />
              <h4 className="font-semibold text-sm gold-gradient">Prayer Wall</h4>
              <p className="text-xs text-muted-foreground mt-1">Stand in agreement with others.</p>
              <span className="text-xs text-accent mt-2 inline-flex items-center gap-1 font-semibold">Join Prayer <ChevronRight size={12} /></span>
            </Link>

            <Link to="/global-prayer-map" className="group rounded-xl border border-border/60 bg-gradient-to-br from-blue-500/10 to-transparent p-4 hover:border-accent/40 transition">
              <Globe2 size={22} className="text-blue-400 mb-2" />
              <h4 className="font-semibold text-sm">195+ Nations</h4>
              <p className="text-xs text-muted-foreground mt-1">Through prayers and ministries worldwide.</p>
              <span className="text-xs text-accent mt-2 inline-flex items-center gap-1 font-semibold">View Map <ChevronRight size={12} /></span>
            </Link>

            <Link to="/prayer-room" className="group rounded-xl border border-border/60 bg-gradient-to-br from-teal-500/10 to-transparent p-4 hover:border-accent/40 transition">
              <Users size={22} className="text-teal-400 mb-2" />
              <h4 className="font-semibold text-sm">24/7 Prayer</h4>
              <p className="text-xs text-muted-foreground mt-1">We're here for you anytime you need us.</p>
              <span className="text-xs text-accent mt-2 inline-flex items-center gap-1 font-semibold">Enter Room <ChevronRight size={12} /></span>
            </Link>

            <Link to="/bookstore" className="group rounded-xl border border-border/60 bg-gradient-to-br from-pink-500/10 to-transparent p-4 hover:border-accent/40 transition">
              <BookOpen size={22} className="text-pink-400 mb-2" />
              <h4 className="font-semibold text-sm">Stay Rooted</h4>
              <p className="text-xs text-muted-foreground mt-1">Books & resources for ministers.</p>
              <span className="text-xs text-accent mt-2 inline-flex items-center gap-1 font-semibold">Visit Bookstore <ChevronRight size={12} /></span>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LiveTV;
