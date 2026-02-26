import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Radio, Waves, Heart, Share2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";

const PLACEHOLDER_STREAM = "/audio/tongues.mp3"; // Placeholder — replace with live stream URL

const OnlineRadio = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Visualizer bars animation
  const bars = Array.from({ length: 32 });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) setCurrentTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setShowVisualizer(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setShowVisualizer(true);
      }).catch(() => {});
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <audio ref={audioRef} src={PLACEHOLDER_STREAM} loop preload="auto" />

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden pt-16">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
        <div className="absolute inset-0 overflow-hidden">
          {/* Pulsing rings */}
          <AnimatePresence>
            {isPlaying && [0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.3, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-accent/20"
              />
            ))}
          </AnimatePresence>
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-12 flex flex-col items-center">
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-8"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying ? 'animate-ping bg-red-400' : 'bg-muted-foreground/40'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-red-500' : 'bg-muted-foreground/40'}`} />
            </span>
            <span className={`text-xs font-semibold tracking-widest uppercase ${isPlaying ? 'text-red-500' : 'text-muted-foreground'}`}>
              {isPlaying ? "Live Now" : "Offline"}
            </span>
          </motion.div>

          {/* Album art / Logo disc */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative mb-8"
          >
            {/* Outer glow ring */}
            <div className={`absolute inset-0 rounded-full transition-all duration-700 ${isPlaying ? 'shadow-[0_0_80px_20px_hsl(var(--accent)/0.25)]' : ''}`} />
            
            {/* Vinyl record effect */}
            <motion.div
              animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={isPlaying ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
              className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full"
            >
              {/* Vinyl grooves */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-800 shadow-2xl" />
              <div className="absolute inset-3 rounded-full border border-neutral-700/50" />
              <div className="absolute inset-6 rounded-full border border-neutral-700/30" />
              <div className="absolute inset-9 rounded-full border border-neutral-700/20" />
              <div className="absolute inset-12 rounded-full border border-neutral-700/10" />
              
              {/* Center label */}
              <div className="absolute inset-[25%] rounded-full bg-gradient-to-br from-accent/80 to-accent overflow-hidden flex items-center justify-center shadow-inner">
                <img src={logo} alt="ISM Radio" className="w-3/4 h-3/4 object-contain drop-shadow-lg" />
              </div>
              
              {/* Light reflection */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
            </motion.div>
          </motion.div>

          {/* Station info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-1 flex items-center justify-center gap-2">
              <Radio size={24} className="text-accent" />
              ISM Radio
            </h1>
            <p className="text-muted-foreground text-sm">Ministers Prayer Network • 24/7 Worship & Prayer</p>
            {isPlaying && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-accent mt-2 font-medium"
              >
                Streaming • {formatTime(currentTime)}
              </motion.p>
            )}
          </motion.div>

          {/* Audio visualizer */}
          <div className="h-12 flex items-end justify-center gap-[3px] mb-8 w-full max-w-xs">
            {bars.map((_, i) => (
              <motion.div
                key={i}
                animate={showVisualizer ? {
                  height: [4, Math.random() * 40 + 8, Math.random() * 20 + 4, Math.random() * 36 + 6, 4],
                } : { height: 4 }}
                transition={showVisualizer ? {
                  duration: 0.8 + Math.random() * 0.4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: i * 0.03,
                } : { duration: 0.3 }}
                className="w-1.5 rounded-full bg-accent/60"
                style={{ minHeight: 4 }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 mb-8">
            {/* Volume */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Play/Pause */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-[0_4px_30px_-5px_hsl(var(--accent)/0.5)] hover:shadow-[0_4px_40px_-5px_hsl(var(--accent)/0.7)] transition-shadow"
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </motion.button>

            {/* Like */}
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors">
              <Heart size={20} />
            </button>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-3 w-full max-w-[200px] mb-10">
            <VolumeX size={14} className="text-muted-foreground shrink-0" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-full h-1 rounded-full appearance-none bg-border cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md"
            />
            <Volume2 size={14} className="text-muted-foreground shrink-0" />
          </div>

          {/* Quick links */}
          <div className="flex gap-3">
            <Link to="/prayer-room">
              <motion.div whileHover={{ y: -2 }} className="px-4 py-2 rounded-full border border-border/50 bg-muted/30 text-sm text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors flex items-center gap-2 cursor-pointer">
                <Waves size={14} /> Prayer Room
              </motion.div>
            </Link>
            <Link to="/live-tv">
              <motion.div whileHover={{ y: -2 }} className="px-4 py-2 rounded-full border border-border/50 bg-muted/30 text-sm text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors flex items-center gap-2 cursor-pointer">
                <Radio size={14} /> Live TV
              </motion.div>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OnlineRadio;
