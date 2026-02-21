import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { HeroButton } from "./HeroButton";
import { Link } from "react-router-dom";
import HeroGlobe from "./HeroGlobe";

const HeroSection = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const startAudio = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      const audio = new Audio("/audio/tongues.mp3");
      audio.loop = true;
      audio.volume = 0.01;
      audioRef.current = audio;
      audio.play().catch(() => {});
    };

    if (document.readyState === "complete") {
      startAudio();
    } else {
      window.addEventListener("load", startAudio);
    }

    return () => {
      window.removeEventListener("load", startAudio);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[hsl(var(--navy))]">
      {/* 3D Globe background */}
      <HeroGlobe />

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--navy))_80%)]" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block mb-6"
          >
            <span className="px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase glass-card text-primary-foreground border border-primary-foreground/20">
              ISM Ministers Prayer Network
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-primary-foreground mb-6 text-balance leading-tight">
            Unite in Prayer,{" "}
            <span className="gold-gradient">Transform the World</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-xl mx-auto">
            A global platform connecting believers for powerful, united intercession across nations and time zones.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
