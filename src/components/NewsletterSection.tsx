import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: email.trim(),
        full_name: name.trim() || null,
      });
      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed!");
        } else {
          throw error;
        }
      } else {
        toast.success("Subscribed successfully! 🎉");
      }
      setEmail("");
      setName("");
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-16 border-t border-border"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-14 h-14 rounded-full gold-gradient-bg flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-accent-foreground" />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-2">Stay Connected</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Subscribe to our newsletter for prayer updates, event announcements, and ministry resources.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="sm:w-40"
            />
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={submitting} className="gold-gradient-bg text-accent-foreground hover:opacity-90">
              {submitting ? "..." : "Subscribe"}
            </Button>
          </form>
        </div>
      </div>
    </motion.section>
  );
};

export default NewsletterSection;
