import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { Star } from "lucide-react";

const testimonies = [
  {
    name: "Grace A.",
    location: "Lagos, Nigeria",
    text: "Through this network, my prayer life was transformed. God answered a prayer I had carried for 7 years!",
  },
  {
    name: "Daniel K.",
    location: "Nairobi, Kenya",
    text: "The prayer groups connected me with intercessors who stood with me. My family is now restored.",
  },
  {
    name: "Sarah M.",
    location: "London, UK",
    text: "I submitted a prayer request and within weeks received my breakthrough. God is faithful!",
  },
];

const TestimoniesSection = () => (
  <section className="py-24 hero-gradient text-primary-foreground">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
          Testimonies of <span className="gold-gradient">God's Faithfulness</span>
        </h2>
        <p className="text-primary-foreground/70 max-w-2xl mx-auto">
          Real stories from real believers experiencing the power of united prayer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonies.map((testimony, i) => (
          <motion.div
            key={testimony.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
          >
            <GlassCard className="h-full">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} className="fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-card-foreground/80 mb-4 italic">
                "{testimony.text}"
              </p>
              <div>
                <p className="font-semibold text-sm text-card-foreground">{testimony.name}</p>
                <p className="text-xs text-muted-foreground">{testimony.location}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimoniesSection;
