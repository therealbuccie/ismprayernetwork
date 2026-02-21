import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Star, Video, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockTestimonies = [
  { id: 1, title: "Healed from chronic illness", author: "Grace A.", location: "Lagos, Nigeria", text: "After 5 years of battling a chronic condition, prayers from this network led to my complete healing. Doctors confirmed it!", hasVideo: true },
  { id: 2, title: "Family reconciled after 3 years", author: "Daniel K.", location: "Nairobi, Kenya", text: "My family had been torn apart. Through persistent prayer, God brought us back together. We are now closer than ever.", hasVideo: false },
  { id: 3, title: "Miraculous financial provision", author: "Sarah M.", location: "London, UK", text: "I was facing bankruptcy when this community prayed with me. Within a month, unexpected doors opened.", hasVideo: true },
  { id: 4, title: "Delivered from addiction", author: "James O.", location: "Accra, Ghana", text: "10 years of bondage broken through united prayer. I am free and living for Christ.", hasVideo: false },
];

const Testimonies = () => (
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
            Powerful <span className="gold-gradient">Testimonies</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Celebrate God's faithfulness through stories of answered prayers.
          </p>
        </motion.div>

        <div className="flex justify-center mb-8">
          <Button className="gold-gradient-bg text-accent-foreground hover:opacity-90 gap-2">
            <Plus size={16} /> Share Testimony
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockTestimonies.map((testimony, i) => (
            <motion.div
              key={testimony.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard variant="hover" className="h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={12} className="fill-accent text-accent" />
                    ))}
                  </div>
                  {testimony.hasVideo && (
                    <span className="text-xs text-accent flex items-center gap-1">
                      <Video size={12} /> Video
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-semibold text-lg mb-2">{testimony.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 italic">"{testimony.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{testimony.author}</p>
                    <p className="text-xs text-muted-foreground">{testimony.location}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">
                    Read More
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

export default Testimonies;
