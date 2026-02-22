import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Star, Video, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Testimonies = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: testimonies, isLoading } = useQuery({
    queryKey: ["testimonies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Title and content are required"); return; }
    if (!user) { toast.error("Please sign in to share a testimony"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("testimonies").insert({
        title: title.trim(),
        content: content.trim(),
        author_name: profile?.full_name || "Anonymous",
        location: location.trim() || null,
        user_id: user.id,
      });
      if (error) throw error;
      toast.success("Testimony submitted! It will appear once approved.");
      setTitle("");
      setContent("");
      setLocation("");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["testimonies"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">
              Powerful <span className="gold-gradient">Testimonies</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Celebrate God's faithfulness through stories of answered prayers.
            </p>
          </motion.div>

          <div className="flex justify-center mb-8">
            <Button
              className="gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2"
              onClick={() => {
                if (!user) { toast.error("Please sign in to share a testimony"); return; }
                setModalOpen(true);
              }}
            >
              <Plus size={16} /> Share Testimony
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">Loading testimonies...</div>
          ) : !testimonies?.length ? (
            <div className="text-center text-muted-foreground py-12">No testimonies yet. Share what God has done!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonies.map((testimony, i) => (
                <motion.div key={testimony.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <GlassCard variant="hover" className="h-full">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} size={12} className="fill-accent text-accent" />
                        ))}
                      </div>
                      {testimony.video_url && (
                        <span className="text-xs text-accent flex items-center gap-1">
                          <Video size={12} /> Video
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-semibold text-lg mb-2">{testimony.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 italic">"{testimony.content}"</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{testimony.author_name}</p>
                        {testimony.location && <p className="text-xs text-muted-foreground">{testimony.location}</p>}
                      </div>
                      {!testimony.is_approved && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Pending approval</span>
                      )}
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
            <DialogTitle>Share Your Testimony</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Title *</Label>
              <Input placeholder="e.g. Healed from chronic illness" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Your Testimony *</Label>
              <Textarea placeholder="Share what God has done..." rows={4} value={content} onChange={e => setContent(e.target.value)} />
            </div>
            <div>
              <Label>Location (optional)</Label>
              <Input placeholder="e.g. Lagos, Nigeria" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
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

export default Testimonies;
