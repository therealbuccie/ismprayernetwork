import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Users, Lock, Globe, Plus, Share2, Copy, Check, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import VideoCall from "@/components/VideoCall";

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
}

const PrayerGroups = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Video call state
  const [callInfo, setCallInfo] = useState<{ url: string; token: string; groupId: string } | null>(null);
  const [joiningCall, setJoiningCall] = useState<string | null>(null);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["prayer-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_groups")
        .select("*")
        .order("member_count", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: myMemberships } = useQuery({
    queryKey: ["my-group-memberships", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map(d => d.group_id);
    },
    enabled: !!user,
  });

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Group name is required"); return; }
    if (!user) { toast.error("Please sign in"); return; }
    setSubmitting(true);
    try {
      const slug = generateSlug(name);
      const { data: group, error } = await supabase.from("prayer_groups").insert({
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
        created_by: user.id,
        slug,
      }).select("id, slug").single();

      if (error) throw error;

      toast.success("Group created! 🙏");
      setName("");
      setDescription("");
      setModalOpen(false);
      setShareSlug(group.slug);

      void supabase.from("group_members").insert({ group_id: group.id, user_id: user.id }).then(({ error: joinError }) => {
        if (joinError && joinError.code !== "23505") {
          toast.error("Group created, but auto-join is still syncing. You can tap Join now.");
        }
        queryClient.invalidateQueries({ queryKey: ["prayer-groups"] });
        queryClient.invalidateQueries({ queryKey: ["my-group-memberships", user.id] });
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    if (!user) { toast.error("Please sign in to join this group"); return; }
    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: user.id,
      });
      if (error) {
        if (error.code === "23505") { toast.info("You're already a member"); return; }
        throw error;
      }
      toast.success("Welcome to the group! 🙏");
      queryClient.invalidateQueries({ queryKey: ["prayer-groups"] });
      queryClient.invalidateQueries({ queryKey: ["my-group-memberships"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/groups/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied! Share with loved ones 🔗");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartCall = async (group: any) => {
    if (!user) { toast.error("Please sign in first"); return; }
    setJoiningCall(group.id);
    try {
      const { data, error } = await supabase.functions.invoke("daily-room", {
        body: { group_slug: group.slug, group_name: group.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCallInfo({ url: data.url, token: data.token, groupId: group.id, groupName: group.name, isModerator: !!data.is_moderator });
    } catch (err: any) {
      toast.error(err.message || "Failed to start call");
    } finally {
      setJoiningCall(null);
    }
  };

  // If in a call, render full-screen video
  if (callInfo) {
    return (
      <VideoCall
        roomUrl={callInfo.url}
        token={callInfo.token}
        userName={profile?.full_name || user?.user_metadata?.full_name || "Guest"}
        groupId={callInfo.groupId}
        userId={user?.id}
        groupName={callInfo.groupName}
        isModerator={callInfo.isModerator}
        onLeave={() => setCallInfo(null)}
      />
    );

  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">
              Prayer <span className="gold-gradient">Groups</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Build your prayer group. Create a group, share the link, and start a live prayer call together.
            </p>
          </motion.div>

          <div className="flex justify-center mb-8">
            <Button
              className="gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2"
              onClick={() => {
                if (!user) { toast.error("Please sign in to create a group"); return; }
                setModalOpen(true);
              }}
            >
              <Plus size={16} /> Create Group
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">Loading groups...</div>
          ) : !groups?.length ? (
            <div className="text-center text-muted-foreground py-12">No groups yet. Create the first one!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group: any, i: number) => {
                const isMember = myMemberships?.includes(group.id);
                return (
                  <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <GlassCard variant="hover" className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          {group.is_public ? <Globe size={10} /> : <Lock size={10} />}
                          {group.is_public ? "Public" : "Private"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users size={12} /> {group.member_count} {group.member_count === 1 ? "member" : "members"}
                        </span>
                      </div>
                      <h3 className="font-serif font-semibold text-lg mb-2">{group.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-1">{group.description || "A prayer group"}</p>
                      <div className="flex gap-2 flex-wrap">
                        {isMember ? (
                          <>
                            <Button
                              size="sm"
                              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white flex-1"
                              onClick={() => handleStartCall(group)}
                              disabled={joiningCall === group.id}
                            >
                              <Video size={14} />
                              {joiningCall === group.id ? "Connecting..." : "Join Call"}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => handleCopyLink(group.slug)}>
                              <Share2 size={13} /> Share
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90" onClick={() => handleJoin(group.id)}>
                            Join Group
                          </Button>
                        )}
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Create Group Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Prayer Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Group Name *</Label>
              <Input placeholder="e.g. Intercessors for Nations" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="What is this group about?" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              {isPublic ? "Public — anyone can find & join" : "Private — share link to invite"}
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Link Modal */}
      <Dialog open={!!shareSlug} onOpenChange={() => setShareSlug(null)}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Your Group is Ready! 🎉</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">Share this link with family and loved ones so they can join your prayer group.</p>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
            <input
              readOnly
              value={`${window.location.origin}/groups/${shareSlug}`}
              className="flex-1 bg-transparent text-sm outline-none text-foreground"
            />
            <Button size="sm" variant="outline" className="gap-1" onClick={() => shareSlug && handleCopyLink(shareSlug)}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrayerGroups;
