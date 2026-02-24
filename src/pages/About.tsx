import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Globe, BookOpen, Users, Heart } from "lucide-react";

const values = [
  { icon: Globe, title: "Global Reach", desc: "Connecting ministers across continents through unified prayer." },
  { icon: BookOpen, title: "Biblical Foundation", desc: "Rooted in scripture, driven by faith, and guided by the Holy Spirit." },
  { icon: Users, title: "Community", desc: "Building a family of ministers who support and uplift one another." },
  { icon: Heart, title: "Compassion", desc: "Serving with love, praying with empathy, and acting with grace." },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            About <span className="gold-gradient">Us</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Learn more about the ISM Ministers Prayer Network and our mission.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard size="xl">
              <h2 className="text-2xl font-serif font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                The ISM Ministers Prayer Network exists to unite ministers of the gospel across the world in fervent, 
                consistent prayer. We believe that when ministers stand together in prayer, walls are broken, 
                communities are transformed, and lives are forever changed. Our mission is to create a global 
                network of prayer warriors who intercede for one another, for nations, and for the advancement 
                of God's kingdom.
              </p>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard size="xl">
              <h2 className="text-2xl font-serif font-bold mb-4">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To see every minister empowered through prayer, connected in fellowship, and equipped to 
                impact their communities for Christ. We envision a world where no minister stands alone — 
                where every prayer request is met with a chorus of intercession from brothers and sisters 
                across the globe.
              </p>
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-2xl font-serif font-bold mb-6 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((v, i) => (
                <GlassCard key={i}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full gold-gradient-bg flex items-center justify-center shrink-0">
                      <v.icon size={20} className="text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg">{v.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{v.desc}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default About;
