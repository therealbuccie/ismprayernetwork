import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { Globe, Users, BookOpen, MessageCircle, Video, Shield } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Global Prayer Map",
    description: "See prayer activity across the world in real-time with our interactive map.",
  },
  {
    icon: Users,
    title: "Prayer Groups",
    description: "Create or join private and public prayer groups for focused intercession.",
  },
  {
    icon: BookOpen,
    title: "Prayer Points",
    description: "Access categorised prayer points for structured and guided prayer sessions.",
  },
  {
    icon: MessageCircle,
    title: "Prayer Requests",
    description: "Submit and respond to prayer requests from believers around the globe.",
  },
  {
    icon: Video,
    title: "Video Testimonies",
    description: "Share powerful video testimonies of answered prayers and breakthroughs.",
  },
  {
    icon: Shield,
    title: "Admin Dashboard",
    description: "Manage users, content, and prayer activities with a comprehensive admin panel.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => (
  <section className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
          Everything You Need to{" "}
          <span className="gold-gradient">Pray Together</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A complete platform designed to unite believers in prayer, fellowship, and shared testimonies.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={item}>
            <GlassCard variant="hover" className="h-full">
              <div className="w-12 h-12 rounded-lg gold-gradient-bg flex items-center justify-center mb-4">
                <feature.icon size={22} className="text-accent-foreground" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default FeaturesSection;
