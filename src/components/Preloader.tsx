import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "done">("loading");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerate as it nears completion
        const increment = prev < 60 ? 3 : prev < 85 ? 2 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        setPhase("done");
        setTimeout(onComplete, 600);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" ? null : null}
      <motion.div
        key="preloader"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[hsl(230,30%,7%)] ${
          phase === "done" ? "pointer-events-none" : ""
        }`}
        style={phase === "done" ? { opacity: 0, transition: "opacity 0.6s ease" } : {}}
      >
        {/* Radial glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-80 h-80 rounded-full"
            style={{
              background:
                "radial-gradient(circle, hsl(38 85% 55% / 0.3) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Logo with animations */}
        <motion.div className="relative z-10 flex flex-col items-center">
          {/* Spinning ring */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute -inset-4 rounded-full border border-dashed"
              style={{ borderColor: "hsl(38 85% 55% / 0.3)" }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
              className="absolute -inset-8 rounded-full border border-dotted"
              style={{ borderColor: "hsl(38 85% 55% / 0.15)" }}
            />

            {/* Logo */}
            <motion.img
              src={logo}
              alt="Loading"
              className="w-24 h-24 object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.5)]"
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, 3, -3, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Progress bar */}
          <div className="mt-10 w-48 h-1 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, hsl(38 85% 55%), hsl(32 90% 48%))",
                width: `${progress}%`,
              }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Shimmer text */}
          <motion.p
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="mt-4 text-xs tracking-[0.3em] uppercase"
            style={{ color: "hsl(38 85% 55% / 0.7)" }}
          >
            Preparing your experience
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Preloader;
