import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, Lock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import AuthGateModal from "@/components/AuthGateModal";

const JoinGroup = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const { data: group, isLoading } = useQuery({
    queryKey: ["group-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_groups")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: isMember } = useQuery({
    queryKey: ["group-membership", group?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", group!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!group && !!user,
  });

  const handleJoin = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setJoining(true);
    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: group!.id,
        user_id: user.id,
      });
      if (error) {
        if (error.code === "23505") { toast.info("You're already a member!"); return; }
        throw error;
      }
      toast.success("Welcome to the community! 🙏");
      queryClient.invalidateQueries({ queryKey: ["group-membership"] });
      queryClient.invalidateQueries({ queryKey: ["group-by-slug"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center text-muted-foreground">Loading...</div>
        <Footer />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <h1 className="text-2xl font-serif font-bold mb-4">Community Not Found</h1>
          <p className="text-muted-foreground mb-6">This prayer community link may be invalid or expired.</p>
          <Button variant="outline" onClick={() => navigate("/groups")} className="gap-2">
            <ArrowLeft size={16} /> Browse Communities
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </div>
              <Badge variant="secondary" className="mb-3 text-xs gap-1">
                {group.is_public ? <Globe size={10} /> : <Lock size={10} />}
                {group.is_public ? "Public Community" : "Private Community"}
              </Badge>
              <h1 className="text-2xl font-serif font-bold mb-2">{group.name}</h1>
              <p className="text-muted-foreground text-sm mb-2">{group.description || "A prayer community"}</p>
              <p className="text-xs text-muted-foreground mb-6 flex items-center justify-center gap-1">
                <Users size={12} /> {group.member_count} {group.member_count === 1 ? "member" : "members"}
              </p>

              {isMember ? (
                <div className="space-y-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20">✓ You're a member</Badge>
                  <div>
                    <Button variant="outline" onClick={() => navigate("/groups")} className="gap-2">
                      <ArrowLeft size={16} /> Back to Communities
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90"
                  size="lg"
                  onClick={handleJoin}
                  disabled={joining}
                >
                  {joining ? "Joining..." : "Join Community"}
                </Button>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
      <Footer />

      {showAuth && (
        <AuthGateModal
          open={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            handleJoin();
          }}
          redirectTo={`/groups/${slug}`}
        />
      )}
    </div>
  );
};

export default JoinGroup;
