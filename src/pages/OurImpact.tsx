import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Globe, Users, BookOpen, HandHeart, TrendingUp, Church } from "lucide-react";

const stats = [
  { icon: Users, value: "5,000+", label: "Ministers Connected" },
  { icon: Globe, value: "80+", label: "Countries Reached" },
  { icon: HandHeart, value: "50,000+", label: "Prayers Offered" },
  { icon: BookOpen, value: "200+", label: "Resources Shared" },
  { icon: Church, value: "1,500+", label: "Churches Impacted" },
  { icon: TrendingUp, value: "300%", label: "Growth in 2 Years" },
];

const OurImpact = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Our <span className="gold-gradient">Impact</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how God is moving through our global prayer network.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
              <GlassCard className="text-center">
                <div className="w-14 h-14 rounded-full gold-gradient-bg flex items-center justify-center mx-auto mb-3">
                  <s.icon size={24} className="text-accent-foreground" />
                </div>
                <p className="text-3xl font-serif font-bold gold-gradient">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <GlassCard size="xl">
              <h2 className="text-2xl font-serif font-bold mb-4">Transforming Lives Through Prayer</h2>
              <p className="text-muted-foreground leading-relaxed">
                Since our inception, the ISM Ministers Prayer Network has been at the forefront of 
                connecting ministers of the gospel worldwide. Our prayer meetings, conferences, and 
                digital platforms have enabled thousands of ministers to find support, encouragement, 
                and spiritual renewal. Every prayer request submitted is met with a wave of intercession 
                from our global community.
              </p>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <GlassCard size="xl">
              <h2 className="text-2xl font-serif font-bold mb-4">Looking Ahead</h2>
              <p className="text-muted-foreground leading-relaxed">
                We're committed to expanding our reach, developing new resources for ministers, 
                and deepening our prayer initiatives. With your partnership, we aim to connect 
                ministers in every nation and bring the transformative power of united prayer 
                to every corner of the world.
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default OurImpact;
