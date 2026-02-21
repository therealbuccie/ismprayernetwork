import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Tv, Heart, MessageSquareHeart, Share2, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HeroButton } from "@/components/HeroButton";
import Hls from "hls.js";

const HLS_URL = "https://app.viloud.tv/hls/channel/115a7990a44a876c8aeda01a99cf32c5.m3u8";

const LiveTV = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(HLS_URL);
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
      video.src = HLS_URL;
      video.addEventListener("loadedmetadata", () => {
        setIsLive(true);
        video.play().catch(() => {});
      });
    }
  }, []);

  const handleShare = async () => {
    const shareData = { title: "ISM Ministers Prayer Network - LiveTV", url: window.location.href };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Decorative background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-accent/5 blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[120px]" />
      </div>

      <div className="relative z-10 pt-18 pb-10">
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
                {isLive ? "Live Now" : "Live TV"}
              </span>
            </motion.div>

            <h1 className="text-2xl md:text-3xl font-serif font-bold mb-1.5">
              ISM Ministers{" "}
              <span className="gold-gradient">Live TV</span>
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-xs md:text-sm">
              Watch live broadcasts, prayer sessions, and ministry events.
            </p>
          </motion.div>

          {/* Video Player */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto mb-4"
          >
            <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-accent/10 bg-card">
              {/* Glow ring */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-accent/20 via-transparent to-accent/10 pointer-events-none z-10" />

              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  poster=""
                />

                {/* Overlay when not live */}
                {!isLive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                    <div className="text-center">
                      <Tv size={56} className="mx-auto mb-3 text-accent/40" />
                      <p className="text-foreground/80 font-medium">Connecting to live stream…</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
          >
            <Link to="/partner">
              <HeroButton variant="gold" size="default" className="gap-2 min-w-[160px]">
                <Heart size={18} /> Give / Partner
              </HeroButton>
            </Link>

            <Link to="/testimonies">
              <HeroButton variant="outline" size="default" className="gap-2 min-w-[160px] text-foreground border-border hover:bg-muted">
                <MessageSquareHeart size={18} /> Share Testimony
              </HeroButton>
            </Link>

            <button onClick={handleShare}>
              <HeroButton variant="ghost" size="default" className="gap-2 min-w-[120px] text-foreground">
                <Share2 size={18} /> Share
              </HeroButton>
            </button>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-3xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {[
              { icon: Tv, title: "24/7 Broadcasting", desc: "Watch ministry content and live prayer sessions around the clock." },
              { icon: Heart, title: "Support the Ministry", desc: "Your partnership helps reach ministers worldwide with the gospel." },
              { icon: MessageSquareHeart, title: "Share Your Story", desc: "Inspire others by sharing what God has done in your life." },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.1 }}
                className="glass-card rounded-xl p-4 border border-border/50 text-center hover:border-accent/30 transition-colors duration-300"
              >
                <card.icon size={28} className="mx-auto mb-3 text-accent" />
                <h3 className="font-serif font-semibold mb-1.5">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LiveTV;
