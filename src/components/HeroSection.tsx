import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { HeroButton } from "./HeroButton";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const HeroSection = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let started = false;
    let mounted = true;

    const startAudio = (e: Event) => {
      // Only respond to real user-initiated events
      if (started || !e.isTrusted) return;
      started = true;
      const audio = new Audio("/audio/tongues.mp3");
      audio.loop = true;
      audio.volume = 0.02;
      audioRef.current = audio;
      audio.play().catch(() => {});
      cleanup();
    };

    const cleanup = () => {
      document.removeEventListener("click", startAudio, true);
      document.removeEventListener("touchstart", startAudio, true);
      document.removeEventListener("scroll", startAudio, true);
      document.removeEventListener("keydown", startAudio, true);
    };

    // Delay attaching listeners so preloader animations don't trigger them
    const timeout = setTimeout(() => {
      if (!mounted) return;
      document.addEventListener("click", startAudio, true);
      document.addEventListener("touchstart", startAudio, true);
      document.addEventListener("scroll", startAudio, true);
      document.addEventListener("keydown", startAudio, true);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      cleanup();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video background - slowed down */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        ref={(el) => {
          if (el) el.playbackRate = 0.5;
        }}
      >
        <source src="/video/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60 z-[1]" />

      {/* Gradient overlay at bottom */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/80 via-transparent to-black/30" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-2xl mx-auto flex flex-col items-center"
        >
          {/* Logo */}
          <motion.img
            src={logo}
            alt="ISM Ministers Prayer Network"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="w-32 h-32 md:w-40 md:h-40 object-contain mb-8 drop-shadow-[0_0_40px_rgba(212,175,55,0.5)]"
          />

          {/* Headline — fewer words, bold & clear */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-4 leading-[1.1] tracking-tight"
          >
            Pray. <span className="gold-gradient">Unite.</span> Transform.
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl text-white/70 mb-10 max-w-md font-light"
          >
            A global prayer network for ministers of the gospel.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/auth">
              <HeroButton variant="gold" size="lg">
                Join the Network
              </HeroButton>
            </Link>
            <Link to="/prayer-requests">
              <HeroButton variant="outline" size="lg">
                Submit a Prayer
              </HeroButton>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-white/60"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
