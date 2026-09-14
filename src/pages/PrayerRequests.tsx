import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Heart, Plus, Send, Sparkles, MessageSquareQuote } from "lucide-react";
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

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  praying: "Praying",
  answered: "Answered",
};

const statusClass = (status: string) =>
  status === "answered"
    ? "border-green-500/40 text-green-500"
    : status === "praying"
      ? "border-accent/40 text-accent"
      : "border-border text-muted-foreground";

const PrayerRequests = () => {
  const { user, profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Coordinator response
  const [respondTarget, setRespondTarget] = useState<any | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("praying");
  const [savingResponse, setSavingResponse] = useState(false);

  // Testimony sharing
  const [testimonyTarget, setTestimonyTarget] = useState<any | null>(null);
  const [testimonyTitle, setTestimonyTitle] = useState("");
  const [testimonyText, setTestimonyText] = useState("");
  const [testimonyDate, setTestimonyDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [savingTestimony, setSavingTestimony] = useState(false);

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

  const openRespond = (req: any) => {
    setRespondTarget(req);
    setResponseStatus(req.status || "praying");
    setResponseText(req.response_text || "");
  };

  const saveResponse = async () => {
    if (!respondTarget) return;
    setSavingResponse(true);
    try {
      const { error } = await supabase
        .from("prayer_requests")
        .update({
          status: responseStatus,
          response_text: responseText.trim() || null,
          responded_by: user?.id ?? null,
          responded_at: new Date().toISOString(),
        })
        .eq("id", respondTarget.id);
      if (error) throw error;
      toast.success("Response saved");
      setRespondTarget(null);
      queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingResponse(false);
    }
  };

  const openTestimony = (req: any) => {
    setTestimonyTarget(req);
    setTestimonyTitle(req.title || "");
    setTestimonyText("");
    setTestimonyDate(new Date().toISOString().slice(0, 10));
  };

  const saveTestimony = async () => {
    if (!testimonyTarget || !user) return;
    if (!testimonyText.trim()) { toast.error("Please share what God did"); return; }
    setSavingTestimony(true);
    try {
      const { error } = await supabase.from("testimonies").insert({
        title: testimonyTitle.trim() || testimonyTarget.title,
        content: `${testimonyText.trim()}\n\n(Answered prayer — ${testimonyDate})`,
        author_name: profile?.full_name || "Anonymous",
        user_id: user.id,
        prayer_request_id: testimonyTarget.id,
      });
      if (error) throw error;
      toast.success("Testimony submitted for review. Thank you! 🙏");
      setTestimonyTarget(null);
      queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingTestimony(false);
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
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{req.category}</Badge>
                        <Badge variant="outline" className={`text-xs ${statusClass(req.status || "submitted")}`}>
                          {STATUS_LABELS[req.status || "submitted"]}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{timeAgo(req.created_at)}</span>
                    </div>
                    <h3 className="font-serif font-semibold text-lg mb-2">{req.title}</h3>
                    {req.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{req.description}</p>}
                    <p className="text-sm text-muted-foreground mb-3">By {req.author_name}</p>
                    {req.response_text && (
                      <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 p-3">
                        <p className="text-xs text-accent flex items-center gap-1 mb-1">
                          <MessageSquareQuote size={12} /> From the prayer coordinators
                        </p>
                        <p className="text-sm text-foreground/85 whitespace-pre-wrap">{req.response_text}</p>
                        {req.responded_at && (
                          <p className="text-[11px] text-muted-foreground mt-1">{new Date(req.responded_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Heart size={14} className="text-accent" /> {req.prayer_count} praying
                      </span>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => openRespond(req)}>
                            <MessageSquareQuote size={12} /> Respond
                          </Button>
                        )}
                        {req.status === "answered" && (isAdmin || req.user_id === user?.id) && (
                          <Button size="sm" variant="ghost" className="text-xs gap-1 text-accent" onClick={() => openTestimony(req)}>
                            <Sparkles size={12} /> Share Testimony
                          </Button>
                        )}
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

      {/* Coordinator response */}
      <Dialog open={!!respondTarget} onOpenChange={(o) => !o && setRespondTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Respond to Prayer Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">{respondTarget?.title}</p>
            <div>
              <Label>Status</Label>
              <Select value={responseStatus} onValueChange={setResponseStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="praying">Praying</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Response (one short word of encouragement)</Label>
              <Textarea rows={3} value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="We are standing with you in prayer..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRespondTarget(null)}>Cancel</Button>
              <Button onClick={saveResponse} disabled={savingResponse}>{savingResponse ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share testimony */}
      <Dialog open={!!testimonyTarget} onOpenChange={(o) => !o && setTestimonyTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Testimony</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">In answer to: {testimonyTarget?.title}</p>
            <div>
              <Label>Title (optional)</Label>
              <Input value={testimonyTitle} onChange={e => setTestimonyTitle(e.target.value)} />
            </div>
            <div>
              <Label>Your testimony *</Label>
              <Textarea rows={4} value={testimonyText} onChange={e => setTestimonyText(e.target.value)} placeholder="Share what God did..." />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={testimonyDate} onChange={e => setTestimonyDate(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Your testimony is reviewed before it appears publicly.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTestimonyTarget(null)}>Cancel</Button>
              <Button onClick={saveTestimony} disabled={savingTestimony} className="gap-2">
                <Sparkles size={14} /> {savingTestimony ? "Sharing..." : "Share"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrayerRequests;
