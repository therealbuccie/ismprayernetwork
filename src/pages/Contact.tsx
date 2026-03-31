import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      if (error) throw error;
      toast.success("Message sent! We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">
              Get in <span className="gold-gradient">Touch</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Have questions or need support? We'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard size="lg">
                <h2 className="font-serif text-xl font-semibold mb-6">Send us a message</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <Label htmlFor="contact-name">Name</Label>
                    <Input id="contact-name" placeholder="Your name" className="mt-1" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="contact-email">Email</Label>
                    <Input id="contact-email" type="email" placeholder="you@example.com" className="mt-1" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="contact-message">Message</Label>
                    <Textarea id="contact-message" placeholder="Your message..." className="mt-1" rows={5} value={message} onChange={e => setMessage(e.target.value)} required />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90">
                    {submitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <GlassCard variant="hover">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg gold-gradient-bg flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Email</h3>
                    <p className="text-sm text-muted-foreground">contact@prayernetwork.org</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard variant="hover">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg gold-gradient-bg flex items-center justify-center shrink-0">
                    <Phone size={18} className="text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Phone</h3>
                    <p className="text-sm text-muted-foreground">+44 751 430 0785</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard variant="hover">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg gold-gradient-bg flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Location</h3>
                    <p className="text-sm text-muted-foreground">Global — Serving believers worldwide</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
