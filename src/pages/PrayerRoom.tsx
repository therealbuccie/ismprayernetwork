import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

const PrayerRoom = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Flame className="text-accent" size={28} />
            <h1 className="text-3xl md:text-4xl font-serif font-bold">
              Prayer <span className="gold-gradient">Room</span>
            </h1>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Enter the virtual prayer room. A sacred space for intercession, worship, and communion with God.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="glass-card p-12 rounded-2xl border border-border/50">
            <Flame size={64} className="mx-auto mb-6 text-accent opacity-60" />
            <h2 className="text-xl font-serif font-semibold mb-3">Coming Soon</h2>
            <p className="text-muted-foreground">
              The Prayer Room is being prepared. Soon you'll be able to join live prayer sessions and intercede with believers around the world.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
    <Footer />
  </div>
);

export default PrayerRoom;
