import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PRAYER_DURATION = 15 * 60; // 15 minutes in seconds

interface PrayerTimerProps {
  onComplete: () => void;
  onBack: () => void;
  initialSeconds?: number;
}

const PrayerTimer = ({ onComplete, onBack, initialSeconds }: PrayerTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds ?? PRAYER_DURATION);
  const [minimized, setMinimized] = useState(true);
  const [overtime, setOvertime] = useState(false);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);

  useEffect(() => {
    if (overtime) {
      const timer = setInterval(() => setOvertimeSeconds((s) => s + 1), 1000);
      return () => clearInterval(timer);
    }

    if (secondsLeft <= 0) {
      toast.success("15 minutes complete! Keep going — extra time is being tracked 🙏🔥");
      setOvertime(true);
      return;
    }
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, overtime]);

  const displayMinutes = overtime
    ? Math.floor(overtimeSeconds / 60)
    : Math.floor(secondsLeft / 60);
  const displaySeconds = overtime
    ? overtimeSeconds % 60
    : secondsLeft % 60;
  const progress = overtime
    ? 100
    : ((PRAYER_DURATION - secondsLeft) / PRAYER_DURATION) * 100;

  const totalPrayed = overtime
    ? PRAYER_DURATION + overtimeSeconds
    : PRAYER_DURATION - secondsLeft;
  const totalMin = Math.floor(totalPrayed / 60);

  if (minimized) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setMinimized(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-background/90 backdrop-blur-md border border-accent/30 shadow-lg text-sm font-mono font-bold text-foreground hover:bg-background transition-colors"
      >
        <Flame size={14} className={`text-accent ${overtime ? "animate-bounce" : "animate-pulse"}`} />
        {overtime ? "+" : ""}
        {displayMinutes.toString().padStart(2, "0")}:{displaySeconds.toString().padStart(2, "0")}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-background/90 backdrop-blur-md rounded-2xl border border-accent/30 shadow-2xl p-4 w-52"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Flame size={14} className={`text-accent ${overtime ? "animate-bounce" : "animate-pulse"}`} />
          <span className="text-[11px] font-semibold text-foreground">
            {overtime ? "Extra Time" : "Praying"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
            title="Minimize"
          >
            <Clock size={12} />
          </button>
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-destructive p-0.5 transition-colors"
            title="Exit"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Circular timer */}
      <div className="relative w-28 h-28 mx-auto mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <circle
            cx="50" cy="50" r="44" fill="none"
            stroke={overtime ? "hsl(var(--primary))" : "hsl(var(--accent))"}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={overtime ? 0 : 2 * Math.PI * 44 * (1 - progress / 100)}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono text-foreground tabular-nums">
            {overtime ? "+" : ""}
            {displayMinutes.toString().padStart(2, "0")}:{displaySeconds.toString().padStart(2, "0")}
          </span>
          <span className="text-[9px] text-muted-foreground">
            {overtime ? `${totalMin} min total` : "remaining"}
          </span>
        </div>
      </div>

      {/* Scripture */}
      <p className="text-[10px] text-center text-muted-foreground italic leading-snug">
        {overtime
          ? "\"The effectual fervent prayer of a righteous man availeth much\""
          : displayMinutes > 7
            ? "\"Be still, and know that I am God\""
            : "\"Pray without ceasing\""}
      </p>
    </motion.div>
  );
};

export default PrayerTimer;
