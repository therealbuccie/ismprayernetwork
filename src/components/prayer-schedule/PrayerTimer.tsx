import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, Heart, Share2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const PRAYER_DURATION = 15 * 60; // 15 minutes in seconds

interface PrayerTimerProps {
  onComplete: () => void;
  onBack: () => void;
}

const PrayerTimer = ({ onComplete, onBack }: PrayerTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(PRAYER_DURATION);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    if (secondsLeft <= 0) {
      toast.success("Prayer session complete! God bless you! 🙏🔥");
      onComplete();
      return;
    }
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, isPaused, onComplete]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = ((PRAYER_DURATION - secondsLeft) / PRAYER_DURATION) * 100;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "ISM Prayer Room", url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Timer Circle */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="relative w-52 h-52 sm:w-64 sm:h-64"
      >
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 90}
            strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Flame size={28} className="text-accent mb-1 animate-pulse" />
          <span className="text-4xl sm:text-5xl font-bold font-mono text-foreground tabular-nums">
            {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground mt-1">remaining</span>
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center mt-2">
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Encouragement */}
      <motion.p
        key={minutes}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-center text-muted-foreground italic max-w-sm"
      >
        {minutes > 10
          ? "\"Be still, and know that I am God\" — Psalm 46:10"
          : minutes > 5
          ? "\"The effectual fervent prayer of a righteous man availeth much\" — James 5:16"
          : minutes > 0
          ? "\"Pray without ceasing\" — 1 Thessalonians 5:17"
          : "\"Well done, good and faithful servant\" — Matthew 25:21"}
      </motion.p>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setIsPaused(!isPaused)}
        >
          <Clock size={14} /> {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
          <Share2 size={14} /> Share
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onBack}
        >
          Exit
        </Button>
      </div>
    </div>
  );
};

export default PrayerTimer;
