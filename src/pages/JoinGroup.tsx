import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, Lock, ArrowLeft, Video } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import AuthGateModal from "@/components/AuthGateModal";
import VideoCall from "@/components/VideoCall";

const JoinGroup = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [callInfo, setCallInfo] = useState<{ url: string; token: string; isModerator: boolean } | null>(null);
  const [joiningCall, setJoiningCall] = useState(false);

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
      toast.success("Welcome to the group! 🙏");
      queryClient.invalidateQueries({ queryKey: ["group-membership"] });
      queryClient.invalidateQueries({ queryKey: ["group-by-slug"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleStartCall = async () => {
    if (!user || !group) return;
    setJoiningCall(true);
    try {
      const { data, error } = await supabase.functions.invoke("daily-room", {
        body: { group_slug: group.slug, group_name: group.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCallInfo({ url: data.url, token: data.token, isModerator: !!data.is_moderator });
    } catch (err: any) {
      toast.error(err.message || "Failed to join call");
    } finally {
      setJoiningCall(false);
    }
  };

  // Full-screen video call
  if (callInfo) {
    return (
      <VideoCall
        roomUrl={callInfo.url}
        token={callInfo.token}
        userName={profile?.full_name || user?.user_metadata?.full_name || "Guest"}
        groupId={group?.id}
        userId={user?.id}
        groupName={group?.name}
        isModerator={callInfo.isModerator}
        onLeave={() => setCallInfo(null)}
      />
    );
  }


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
          <h1 className="text-2xl font-serif font-bold mb-4">Group Not Found</h1>
          <p className="text-muted-foreground mb-6">This prayer group link may be invalid or expired.</p>
          <Button variant="outline" onClick={() => navigate("/groups")} className="gap-2">
            <ArrowLeft size={16} /> Browse Groups
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
                {group.is_public ? "Public Group" : "Private Group"}
              </Badge>
              <h1 className="text-2xl font-serif font-bold mb-2">{group.name}</h1>
              <p className="text-muted-foreground text-sm mb-2">{group.description || "A prayer group"}</p>
              <p className="text-xs text-muted-foreground mb-6 flex items-center justify-center gap-1">
                <Users size={12} /> {group.member_count} {group.member_count === 1 ? "member" : "members"}
              </p>

              {isMember ? (
                <div className="space-y-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20">✓ You're a member</Badge>
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                      onClick={handleStartCall}
                      disabled={joiningCall}
                    >
                      <Video size={18} />
                      {joiningCall ? "Connecting..." : "Join Prayer Call"}
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/groups")} className="gap-2">
                      <ArrowLeft size={16} /> Back to Groups
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
                  {joining ? "Joining..." : "Join Group"}
                </Button>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
      <Footer />

      <AuthGateModal
        open={showAuth}
        onOpenChange={(open) => {
          setShowAuth(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ["group-membership"] });
          }
        }}
      />
    </div>
  );
};

export default JoinGroup;
