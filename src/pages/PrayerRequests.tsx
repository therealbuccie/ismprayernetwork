import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Heart, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categories = ["All", "Health", "Family", "Finances", "Spiritual", "Relationships", "Career"];

const mockRequests = [
  { id: 1, title: "Healing for my mother", category: "Health", author: "Anonymous", prayers: 42, time: "2 hours ago" },
  { id: 2, title: "Family restoration and peace", category: "Family", author: "Grace A.", prayers: 28, time: "4 hours ago" },
  { id: 3, title: "Guidance for career transition", category: "Career", author: "Daniel K.", prayers: 15, time: "6 hours ago" },
  { id: 4, title: "Financial breakthrough needed", category: "Finances", author: "Anonymous", prayers: 67, time: "1 day ago" },
  { id: 5, title: "Strength in spiritual warfare", category: "Spiritual", author: "Sarah M.", prayers: 33, time: "1 day ago" },
  { id: 6, title: "Reconciliation with spouse", category: "Relationships", author: "Anonymous", prayers: 51, time: "2 days ago" },
];

const PrayerRequests = () => (
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
            Prayer <span className="gold-gradient">Requests</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Lift each other up in prayer. Submit your request or intercede for others.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={cat === "All" ? "default" : "outline"}
              className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors px-4 py-1.5"
            >
              {cat}
            </Badge>
          ))}
        </div>

        <div className="flex justify-center mb-8">
          <Button className="gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2">
            <Plus size={16} /> Submit Prayer Request
          </Button>
        </div>

        {/* Requests grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRequests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <GlassCard variant="hover" className="h-full">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">{req.category}</Badge>
                  <span className="text-xs text-muted-foreground">{req.time}</span>
                </div>
                <h3 className="font-serif font-semibold text-lg mb-2">{req.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">By {req.author}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Heart size={14} className="text-accent" /> {req.prayers} praying
                  </span>
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <Heart size={12} /> Pray
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default PrayerRequests;
