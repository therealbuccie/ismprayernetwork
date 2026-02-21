import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";

const stats = [
  { value: "50K+", label: "Prayer Warriors" },
  { value: "120+", label: "Countries" },
  { value: "1M+", label: "Prayers Offered" },
  { value: "10K+", label: "Testimonies" },
];

const StatsSection = () => (
  <section className="py-16 bg-secondary/50">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <GlassCard className="text-center">
              <p className="text-3xl md:text-4xl font-serif font-bold gold-gradient mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
