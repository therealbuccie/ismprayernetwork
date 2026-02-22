import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Users, Lock, Globe, Plus } from "lucide-react";
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

const PrayerGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      const { data: group, error } = await supabase.from("prayer_groups").insert({
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      // Auto-join as creator
      await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id });
      toast.success("Group created!");
      setName("");
      setDescription("");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["prayer-groups"] });
      queryClient.invalidateQueries({ queryKey: ["my-group-memberships"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    if (!user) { toast.error("Please sign in to join a group"); return; }
    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: user.id,
      });
      if (error) {
        if (error.code === "23505") { toast.info("You're already a member"); return; }
        throw error;
      }
      toast.success("Joined the group! 🙏");
      queryClient.invalidateQueries({ queryKey: ["prayer-groups"] });
      queryClient.invalidateQueries({ queryKey: ["my-group-memberships"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLeave = async (groupId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Left the group");
      queryClient.invalidateQueries({ queryKey: ["prayer-groups"] });
      queryClient.invalidateQueries({ queryKey: ["my-group-memberships"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

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
              Find your prayer community. Join existing groups or create your own.
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
              {groups.map((group, i) => {
                const isMember = myMemberships?.includes(group.id);
                return (
                  <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <GlassCard variant="hover" className="h-full">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          {group.is_public ? <Globe size={10} /> : <Lock size={10} />}
                          {group.is_public ? "Public" : "Private"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users size={12} /> {group.member_count}
                        </span>
                      </div>
                      <h3 className="font-serif font-semibold text-lg mb-2">{group.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{group.description || "No description"}</p>
                      {isMember ? (
                        <Button size="sm" variant="outline" className="w-full text-destructive" onClick={() => handleLeave(group.id)}>
                          Leave Group
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => handleJoin(group.id)}>
                          Join Group
                        </Button>
                      )}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />

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
              {isPublic ? "Public — anyone can join" : "Private — invite only"}
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
    </div>
  );
};

export default PrayerGroups;
