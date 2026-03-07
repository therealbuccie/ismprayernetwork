import { useState } from "react";
import { format, addDays, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronLeft, ChevronRight, Flame, CheckCircle2, X, Sparkles, Sun, Sunset, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_PER_SLOT = 10;
const MINUTES = [0, 15, 30, 45];

const TIME_PERIODS = [
  { label: "Morning", icon: Sun, hours: [5, 6, 7, 8, 9, 10, 11], emoji: "🌅" },
  { label: "Afternoon", icon: Sparkles, hours: [12, 13, 14, 15, 16], emoji: "☀️" },
  { label: "Evening", icon: Sunset, hours: [17, 18, 19, 20, 21], emoji: "🌇" },
  { label: "Night", icon: Moon, hours: [22, 23, 0, 1, 2, 3, 4], emoji: "🌙" },
];

const formatTime12 = (hour: number, minute: number) => {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
};

const timeToString = (h: number, m: number) =>
  `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;

interface PrayerScheduleProps {
  onStartPraying: () => void;
}

const PrayerSchedule = ({ onStartPraying }: PrayerScheduleProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [activePeriod, setActivePeriod] = useState(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 0;
    if (h >= 12 && h < 17) return 1;
    if (h >= 17 && h < 22) return 2;
    return 3;
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: slots, isLoading } = useQuery({
    queryKey: ["prayer-slots", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_slots")
        .select("*")
        .eq("slot_date", dateStr)
        .eq("status", "booked");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: mySlots } = useQuery({
    queryKey: ["my-prayer-slots", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_slots")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "booked")
        .gte("slot_date", format(new Date(), "yyyy-MM-dd"))
        .order("slot_date", { ascending: true })
        .order("slot_time", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const getSlotCount = (timeStr: string) =>
    slots?.filter((s: any) => s.slot_time === timeStr).length ?? 0;

  const isMySlot = (timeStr: string) =>
    slots?.some((s: any) => s.slot_time === timeStr && s.user_id === user?.id) ?? false;

  const isSlotPast = (hour: number, minute: number) => {
    if (!isToday(selectedDate)) return isBefore(selectedDate, startOfDay(new Date()));
    const now = new Date();
    return hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes());
  };

  const handleBook = async (hour: number, minute: number) => {
    if (!user) return;
    const timeStr = timeToString(hour, minute);
    setBookingSlot(timeStr);
    try {
      const { error } = await supabase.from("prayer_slots").insert({
        user_id: user.id,
        user_email: user.email!,
        user_name: profile?.full_name || user.email?.split("@")[0] || "Minister",
        slot_date: dateStr,
        slot_time: timeStr,
      });
      if (error) throw error;
      toast.success(`You're set! 🙏 Prayer time booked for ${formatTime12(hour, minute)}`);
      queryClient.invalidateQueries({ queryKey: ["prayer-slots", dateStr] });
      queryClient.invalidateQueries({ queryKey: ["my-prayer-slots", user.id] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBookingSlot(null);
    }
  };

  const handleCancel = async (slotId: string) => {
    try {
      const { error } = await supabase.from("prayer_slots").delete().eq("id", slotId);
      if (error) throw error;
      toast.success("Slot cancelled");
      queryClient.invalidateQueries({ queryKey: ["prayer-slots"] });
      queryClient.invalidateQueries({ queryKey: ["my-prayer-slots"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const now = new Date();
  const currentTimeStr = timeToString(now.getHours(), Math.floor(now.getMinutes() / 15) * 15);
  const todayStr = format(now, "yyyy-MM-dd");
  const hasActiveSlotNow = mySlots?.some(
    (s: any) => s.slot_date === todayStr && s.slot_time === currentTimeStr
  );

  const visibleDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), dateOffset + i));
  const currentPeriod = TIME_PERIODS[activePeriod];

  return (
    <div className="space-y-6">
      {/* Friendly Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
          <Flame size={14} className="text-accent" />
          <span className="text-xs font-medium text-accent">15-Minute Prayer Slots</span>
        </div>
        <h2 className="font-serif font-bold text-2xl md:text-3xl text-foreground mb-2">
          Pick a Time to Pray 🙏
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-4">
          Choose a 15-minute slot that works best for you. We'll send you a gentle reminder 
          30 minutes before so you're ready. It's that simple!
        </p>
        <Button
          onClick={onStartPraying}
          className="gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2 px-6 py-3 text-base font-semibold shadow-lg shadow-accent/20"
        >
          <Flame size={18} /> Pray Now
        </Button>
        <p className="text-xs text-muted-foreground mt-2">Or schedule a time below 👇</p>
      </motion.div>

      {/* Active Slot Banner */}
      <AnimatePresence>
        {hasActiveSlotNow && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative overflow-hidden rounded-2xl border-2 border-accent bg-gradient-to-r from-accent/10 via-accent/5 to-transparent p-6"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center animate-pulse">
                <Flame size={28} className="text-accent" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-serif font-bold text-lg text-foreground">
                  It's Your Prayer Time! 🔥
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your 15-minute prayer slot is active right now. Tap below to begin!
                </p>
              </div>
              <Button
                onClick={onStartPraying}
                className="gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2 px-6 py-3 text-base font-semibold shadow-lg shadow-accent/20"
              >
                <Flame size={18} /> Start Praying
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Upcoming Slots */}
      {mySlots && mySlots.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-5 border border-accent/20"
        >
          <h3 className="font-serif font-semibold text-sm mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-accent" />
            Your Scheduled Prayers
          </h3>
          <div className="flex flex-wrap gap-2">
            {mySlots.map((slot: any) => {
              const [h, m] = slot.slot_time.split(":").map(Number);
              return (
                <div
                  key={slot.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs"
                >
                  <span className="font-medium text-foreground">
                    {format(new Date(slot.slot_date + "T00:00:00"), "MMM d")} • {formatTime12(h, m)}
                  </span>
                  <button
                    onClick={() => handleCancel(slot.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Cancel this slot"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Step 1: Pick a Date */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[10px] font-bold">1</span>
          Pick a day
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={() => setDateOffset((o) => Math.max(o - 7, 0))}
            disabled={dateOffset === 0}
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide py-1">
            {visibleDates.map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "flex flex-col items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 min-w-[56px]",
                  isSameDay(date, selectedDate)
                    ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20 scale-105"
                    : isToday(date)
                    ? "bg-accent/10 text-foreground border border-accent/30 hover:bg-accent/20"
                    : "bg-card text-muted-foreground border border-border/50 hover:bg-muted hover:border-border"
                )}
              >
                <span className="text-[10px] uppercase opacity-70">{format(date, "EEE")}</span>
                <span className="text-lg font-bold leading-tight">{format(date, "d")}</span>
                <span className="text-[10px] opacity-70">{format(date, "MMM")}</span>
                {isToday(date) && !isSameDay(date, selectedDate) && (
                  <span className="text-[8px] font-semibold text-accent mt-0.5">Today</span>
                )}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={() => setDateOffset((o) => o + 7)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </motion.div>

      {/* Step 2: Pick a Time */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[10px] font-bold">2</span>
          Choose your time — {format(selectedDate, "EEEE, MMM d")}
        </p>

        {/* Time Period Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {TIME_PERIODS.map((period, idx) => {
            const Icon = period.icon;
            return (
              <button
                key={period.label}
                onClick={() => setActivePeriod(idx)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                  activePeriod === idx
                    ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                    : "bg-card text-muted-foreground border border-border/50 hover:bg-muted"
                )}
              >
                <Icon size={14} />
                {period.label}
              </button>
            );
          })}
        </div>

        {/* Time Slots for Selected Period */}
        <div className="glass-card rounded-xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentPeriod.emoji}</span>
              <h3 className="font-serif font-semibold text-sm text-foreground">
                {currentPeriod.label} Slots
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-accent/20 border border-accent/30" /> Open
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-accent" /> Yours
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">
              Loading available times...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {currentPeriod.hours.map((hour) =>
                MINUTES.map((minute) => {
                  const timeStr = timeToString(hour, minute);
                  const count = getSlotCount(timeStr);
                  const isMine = isMySlot(timeStr);
                  const isFull = count >= MAX_PER_SLOT;
                  const isPast = isSlotPast(hour, minute);
                  const isBooking = bookingSlot === timeStr;

                  return (
                    <motion.button
                      key={timeStr}
                      whileHover={!isPast && !isFull && !isMine ? { scale: 1.02 } : {}}
                      whileTap={!isPast && !isFull && !isMine ? { scale: 0.98 } : {}}
                      disabled={isPast || isFull || isMine || isBooking}
                      onClick={() => handleBook(hour, minute)}
                      className={cn(
                        "relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm transition-all border",
                        isMine
                          ? "bg-accent text-accent-foreground border-accent shadow-md shadow-accent/20 font-semibold"
                          : isPast
                          ? "bg-muted/20 text-muted-foreground/30 border-transparent cursor-not-allowed"
                          : isFull
                          ? "bg-muted/40 text-muted-foreground/50 border-border/20 cursor-not-allowed line-through"
                          : "bg-card text-foreground border-border/50 hover:border-accent/40 hover:bg-accent/5 hover:shadow-sm cursor-pointer"
                      )}
                    >
                      {isMine && <CheckCircle2 size={14} className="shrink-0" />}
                      <span className="font-medium">{formatTime12(hour, minute)}</span>
                      {count > 0 && !isMine && !isFull && (
                        <span className="text-[10px] opacity-40">{count} joined</span>
                      )}
                      {isBooking && (
                        <span className="text-xs animate-pulse">...</span>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground text-center mt-4 italic">
            Tap any open slot to reserve it — you'll get an email reminder before it starts ✉️
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PrayerSchedule;
