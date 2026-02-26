import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Flame, Users, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const JoinPrayerRoom = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ["prayer-session", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_room_sessions")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const handleJoin = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!session) return;
    setJoining(true);
    try {
      const { error } = await supabase.from("prayer_room_participants").insert({
        session_id: session.id,
        full_name: fullName.trim(),
        location: location.trim() || null,
      });
      if (error) throw error;
      setHasJoined(true);
      toast.success("You've joined the prayer! 🙏");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading prayer room...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <Flame size={48} className="text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Prayer Room Not Found</h1>
            <p className="text-muted-foreground mb-6">This prayer link may have expired or is invalid.</p>
            <Button onClick={() => navigate("/prayer-room")} className="gold-gradient-bg text-accent-foreground">
              Go to Prayer Room
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (hasJoined) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <Flame size={40} className="text-accent" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">You're In! 🙏</h1>
            <p className="text-muted-foreground mb-2">
              You've joined <span className="font-semibold text-foreground">{session.owner_name}'s</span> prayer session.
            </p>
            <p className="text-sm text-muted-foreground mb-8">They can see you've joined and are praying with them.</p>
            <Button
              onClick={() => navigate("/prayer-room")}
              className="gold-gradient-bg text-accent-foreground gap-2"
            >
              Enter the Prayer Room <ArrowRight size={16} />
            </Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card rounded-2xl p-8 border border-border/50 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-5">
              <Flame size={32} className="text-accent" />
            </div>
            <h1 className="text-xl font-serif font-bold text-foreground mb-1">
              Join in Prayer
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-semibold text-foreground">{session.owner_name}</span> has invited you to pray together in the ISM Prayer Room.
            </p>

            <div className="space-y-4 text-left">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Your Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="location" className="text-sm font-medium">Location (optional)</Label>
                <div className="relative mt-1">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g. Lagos, Nigeria"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2 mt-2"
              >
                <Users size={16} /> {joining ? "Joining..." : "Join Prayer Session"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default JoinPrayerRoom;
