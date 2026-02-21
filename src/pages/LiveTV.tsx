import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Tv } from "lucide-react";

const LiveTV = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Tv className="text-accent" size={28} />
            <h1 className="text-3xl md:text-4xl font-serif font-bold">
              Live <span className="gold-gradient">TV</span>
            </h1>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Watch ISM Ministers Prayer Network live broadcasts and events.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-5xl mx-auto aspect-video rounded-xl overflow-hidden border border-border/50 bg-card"
        >
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Tv size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No live broadcast at the moment</p>
              <p className="text-sm mt-1">Check back soon for upcoming live events.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    <Footer />
  </div>
);

export default LiveTV;
