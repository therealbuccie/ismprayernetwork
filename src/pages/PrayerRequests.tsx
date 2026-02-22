import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Heart, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const categoryOptions = ["General", "Health", "Family", "Finances", "Spiritual", "Relationships", "Career"];

const PrayerRequests = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["prayer-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: myInteractions } = useQuery({
    queryKey: ["my-prayer-interactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("prayer_interactions")
        .select("prayer_request_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map(d => d.prayer_request_id);
    },
    enabled: !!user,
  });

  const filteredRequests = requests?.filter(
    r => selectedCategory === "All" || r.category === selectedCategory
  ) ?? [];

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!user) { toast.error("Please sign in to submit a prayer request"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("prayer_requests").insert({
        title: title.trim(),
        description: description.trim() || null,
        category,
        author_name: isAnonymous ? "Anonymous" : (profile?.full_name || "Anonymous"),
        user_id: user.id,
        is_anonymous: isAnonymous,
      });
      if (error) throw error;
      toast.success("Prayer request submitted!");
      setTitle("");
      setDescription("");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePray = async (requestId: string) => {
    if (!user) { toast.error("Please sign in to pray"); return; }
    try {
      const { error } = await supabase.from("prayer_interactions").insert({
        prayer_request_id: requestId,
        user_id: user.id,
      });
      if (error) {
        if (error.code === "23505") { toast.info("You're already praying for this"); return; }
        throw error;
      }
      toast.success("🙏 Praying!");
      queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-prayer-interactions"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">
              Prayer <span className="gold-gradient">Requests</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Lift each other up in prayer. Submit your request or intercede for others.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {["All", ...categoryOptions].map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors px-4 py-1.5"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          <div className="flex justify-center mb-8">
            <Button
              className="gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2"
              onClick={() => {
                if (!user) { toast.error("Please sign in to submit a prayer request"); return; }
                setModalOpen(true);
              }}
            >
              <Plus size={16} /> Submit Prayer Request
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">Loading prayer requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">No prayer requests yet. Be the first to submit one!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((req, i) => (
                <motion.div key={req.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard variant="hover" className="h-full">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="text-xs">{req.category}</Badge>
                      <span className="text-xs text-muted-foreground">{timeAgo(req.created_at)}</span>
                    </div>
                    <h3 className="font-serif font-semibold text-lg mb-2">{req.title}</h3>
                    {req.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{req.description}</p>}
                    <p className="text-sm text-muted-foreground mb-4">By {req.author_name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Heart size={14} className="text-accent" /> {req.prayer_count} praying
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        disabled={myInteractions?.includes(req.id)}
                        onClick={() => handlePray(req.id)}
                      >
                        <Heart size={12} /> {myInteractions?.includes(req.id) ? "Praying" : "Pray"}
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Prayer Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Title *</Label>
              <Input placeholder="What do you need prayer for?" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea placeholder="Share more details..." rows={3} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded" />
              Submit anonymously
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                <Send size={14} /> {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrayerRequests;
