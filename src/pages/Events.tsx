import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Cake, Send, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [wishName, setWishName] = useState("");
  const [wishMessage, setWishMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("birthday_month", { ascending: true })
        .order("birthday_day", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: wishes, refetch: refetchWishes } = useQuery({
    queryKey: ["birthday_wishes", selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const { data, error } = await supabase
        .from("birthday_wishes")
        .select("*")
        .eq("event_id", selectedEvent)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEvent,
  });

  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !wishMessage.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("birthday_wishes").insert({
        event_id: selectedEvent,
        author_name: wishName.trim() || "Anonymous",
        message: wishMessage.trim(),
      });
      if (error) throw error;
      toast.success("Birthday wish sent! 🎉");
      setWishMessage("");
      setWishName("");
      refetchWishes();
    } catch {
      toast.error("Failed to send wish");
    } finally {
      setSubmitting(false);
    }
  };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const sortedEvents = events?.sort((a: any, b: any) => {
    const aIsCurrent = a.birthday_month === currentMonth && a.birthday_day === currentDay;
    const bIsCurrent = b.birthday_month === currentMonth && b.birthday_day === currentDay;
    if (aIsCurrent && !bIsCurrent) return -1;
    if (!aIsCurrent && bIsCurrent) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Events & <span className="gold-gradient">Celebrations</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Celebrate our ministers' birthdays and share your love and prayers.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">Loading events...</div>
          ) : !sortedEvents?.length ? (
            <div className="text-center text-muted-foreground py-12">
              <PartyPopper className="mx-auto mb-4 text-accent" size={48} />
              <p>No birthday celebrations yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedEvents.map((event: any, i: number) => {
                const isBirthdayToday = event.birthday_month === currentMonth && event.birthday_day === currentDay;
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <GlassCard className={`relative overflow-hidden ${isBirthdayToday ? "ring-2 ring-accent" : ""}`}>
                      {isBirthdayToday && (
                        <div className="absolute top-3 right-3 gold-gradient-bg text-accent-foreground text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                          <Cake size={12} /> Today!
                        </div>
                      )}
                      {event.minister_image_url && (
                        <img
                          src={event.minister_image_url}
                          alt={event.minister_name}
                          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-accent"
                        />
                      )}
                      {!event.minister_image_url && (
                        <div className="w-24 h-24 rounded-full mx-auto mb-4 gold-gradient-bg flex items-center justify-center">
                          <Cake size={32} className="text-accent-foreground" />
                        </div>
                      )}
                      <h3 className="text-xl font-serif font-bold text-center">{event.minister_name}</h3>
                      <p className="text-center text-sm text-muted-foreground mt-1">
                        {MONTHS[event.birthday_month - 1]} {event.birthday_day}
                      </p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">{event.description}</p>
                      )}
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                      >
                        {selectedEvent === event.id ? "Close" : "🎂 Send a Birthday Wish"}
                      </Button>

                      {selectedEvent === event.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 space-y-3"
                        >
                          <form onSubmit={handleSubmitWish} className="space-y-3">
                            <Input
                              placeholder="Your name (optional)"
                              value={wishName}
                              onChange={(e) => setWishName(e.target.value)}
                            />
                            <Textarea
                              placeholder="Write your birthday wish..."
                              value={wishMessage}
                              onChange={(e) => setWishMessage(e.target.value)}
                              required
                              rows={3}
                            />
                            <Button type="submit" disabled={submitting} className="w-full gold-gradient-bg text-accent-foreground">
                              <Send size={14} className="mr-2" />
                              {submitting ? "Sending..." : "Send Wish"}
                            </Button>
                          </form>

                          {wishes && wishes.length > 0 && (
                            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                              <h4 className="text-sm font-semibold">Wishes ({wishes.length})</h4>
                              {wishes.map((w: any) => (
                                <div key={w.id} className="bg-muted rounded-lg p-3">
                                  <p className="text-sm">{w.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">— {w.author_name}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
