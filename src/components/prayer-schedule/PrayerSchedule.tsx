import { useState } from "react";
import { format, addDays, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ChevronLeft, ChevronRight, Flame, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SLOTS_PER_HOUR = 4; // 15-min slots
const MAX_PER_SLOT = 10;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

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

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Fetch all slots for selected date
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

  // Fetch user's own bookings
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

  // Realtime updates
  // (handled by parent query invalidation via realtime)

  const getSlotCount = (timeStr: string) => {
    return slots?.filter((s: any) => s.slot_time === timeStr).length ?? 0;
  };

  const isMySlot = (timeStr: string) => {
    return slots?.some((s: any) => s.slot_time === timeStr && s.user_id === user?.id) ?? false;
  };

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
      toast.success(`Prayer slot booked for ${formatTime12(hour, minute)}! 🙏`);
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

  // Check if user has an active slot right now
  const now = new Date();
  const currentTimeStr = timeToString(now.getHours(), Math.floor(now.getMinutes() / 15) * 15);
  const todayStr = format(now, "yyyy-MM-dd");
  const hasActiveSlotNow = mySlots?.some(
    (s: any) => s.slot_date === todayStr && s.slot_time === currentTimeStr
  );

  const visibleDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), dateOffset + i));

  return (
    <div className="space-y-6">
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
                  Your 15-minute prayer slot is active right now. Enter the prayer room to begin.
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
            My Upcoming Prayer Slots
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
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Date Selector */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setDateOffset((o) => Math.max(o - 7, 0))}
          disabled={dateOffset === 0}
        >
          <ChevronLeft size={16} />
        </Button>
        <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {visibleDates.map((date) => (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0 min-w-[52px]",
                isSameDay(date, selectedDate)
                  ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="text-[10px] uppercase">{format(date, "EEE")}</span>
              <span className="text-base font-bold">{format(date, "d")}</span>
              <span className="text-[10px]">{format(date, "MMM")}</span>
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setDateOffset((o) => o + 7)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Time Slots Grid */}
      <div className="glass-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-accent" />
          <h3 className="font-serif font-semibold text-sm">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h3>
          <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-accent/20 border border-accent/30" /> Available
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-accent" /> Your slot
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-muted" /> Full
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">
            Loading schedule...
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5">
            {HOURS.map((hour) =>
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
                    whileHover={!isPast && !isFull && !isMine ? { scale: 1.05 } : {}}
                    whileTap={!isPast && !isFull && !isMine ? { scale: 0.95 } : {}}
                    disabled={isPast || isFull || isMine || isBooking}
                    onClick={() => handleBook(hour, minute)}
                    className={cn(
                      "relative flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] transition-all border",
                      isMine
                        ? "bg-accent text-accent-foreground border-accent shadow-sm shadow-accent/20"
                        : isPast
                        ? "bg-muted/30 text-muted-foreground/40 border-transparent cursor-not-allowed"
                        : isFull
                        ? "bg-muted/50 text-muted-foreground/60 border-border/30 cursor-not-allowed"
                        : "bg-accent/5 text-foreground border-accent/15 hover:bg-accent/15 hover:border-accent/30 cursor-pointer"
                    )}
                  >
                    <span className="font-semibold leading-tight">
                      {formatTime12(hour, minute).split(" ")[0]}
                    </span>
                    <span className="text-[8px] opacity-70">
                      {formatTime12(hour, minute).split(" ")[1]}
                    </span>
                    {count > 0 && !isMine && (
                      <span className="text-[7px] mt-0.5 opacity-50">{count}/{MAX_PER_SLOT}</span>
                    )}
                    {isMine && (
                      <CheckCircle2 size={8} className="absolute top-0.5 right-0.5" />
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerSchedule;
