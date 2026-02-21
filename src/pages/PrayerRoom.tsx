import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Flame, Heart, BookOpen, Share2, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroButton } from "@/components/HeroButton";
import { useState } from "react";

const todaysPrayerPoint = {
  date: new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  title: "PRAY CONCERNING TELEVISION AND RADIO BROADCAST OF THE HEALING STREAMS",
  scripture:
    'Romans 10:18 NKJV - "But I say, have they not heard? Yes indeed: \'Their sound has gone out to all the earth, and their words to the ends of the world\'"',
  body: "Thank God for the global broadcast of the Healing Streams Live Healing Services with Pastor Chris through television and radio networks around the world. Pray that every viewer and listener receives miracles, salvation, and restoration through every transmission. Pray that the signals are clear and unhindered, reaching every language, territory, and nation.",
};

const shareUrl = "https://ismprayernetwork.lovable.app/prayer-room";

const PrayerRoom = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                Welcome to the ISM Prayer{" "}
                <span className="gold-gradient">Room</span>
              </h1>
              <p className="text-primary-foreground/70 text-xs md:text-sm">
                Hosted by ISM Ministers Prayer Network
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left: Video/Prayer Embed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 flex flex-col"
          >
            <div className="glass-card rounded-xl overflow-hidden flex-1 min-h-[500px] lg:min-h-[600px]">
              <iframe
                src="https://jcontrol.pro/join"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: "none", borderRadius: "8px", minHeight: "500px" }}
                allow="camera; microphone; autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Participant count & actions */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/prayer-room">
                  <HeroButton variant="gold" size="sm" className="gap-1.5">
                    <Flame size={14} /> Start Praying
                  </HeroButton>
                </Link>
                <Link to="/partner">
                  <HeroButton
                    variant="outline"
                    size="sm"
                    className="text-foreground border-border hover:bg-muted gap-1.5"
                  >
                    <Heart size={14} /> Give Now
                  </HeroButton>
                </Link>
                <Link to="/prayer-requests">
                  <HeroButton variant="gold" size="sm" className="gap-1.5">
                    <BookOpen size={14} /> Prayer Requests
                  </HeroButton>
                </Link>
              </div>
            </div>

            {/* Share Link */}
            <div className="mt-4 flex items-center gap-2">
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
          </motion.div>

          {/* Right Sidebar: Today's Prayer Point */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-4"
          >
            <div className="glass-card rounded-xl p-5 border border-border/50">
              <div className="bg-accent/10 rounded-lg p-3 mb-4 text-center">
                <h2 className="text-lg font-serif font-bold text-accent">
                  Today's Prayer Point
                </h2>
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

              <p className="text-sm text-foreground/80 leading-relaxed">
                {todaysPrayerPoint.body}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="glass-card rounded-xl p-5 border border-border/50">
              <h3 className="font-serif font-semibold text-sm mb-3">
                Prayer Room Info
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>🔥 24/7 Non-stop prayer sessions</p>
                <p>🌍 Ministers from around the world</p>
                <p>🎥 Live video & audio prayer</p>
                <p>📖 Daily prayer points updated</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrayerRoom;
