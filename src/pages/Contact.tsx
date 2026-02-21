import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Contact = () => (
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
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <Label htmlFor="contact-name">Name</Label>
                  <Input id="contact-name" placeholder="Your name" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="contact-email">Email</Label>
                  <Input id="contact-email" type="email" placeholder="you@example.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea id="contact-message" placeholder="Your message..." className="mt-1" rows={5} />
                </div>
                <Button className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90">
                  Send Message
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
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
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

export default Contact;
