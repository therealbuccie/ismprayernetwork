import { motion } from "framer-motion";
import { HeroButton } from "./HeroButton";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto"
      >
        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
          Join the Global Prayer Movement
        </h2>
        <p className="text-muted-foreground mb-8">
          Be part of a worldwide community of believers lifting up prayers 24/7.
          Your prayer can change lives.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth">
            <HeroButton variant="gold" size="lg" className="text-accent-foreground">
              Start Praying Today
            </HeroButton>
          </Link>
          <Link to="/contact">
            <HeroButton variant="outline" size="lg" className="text-foreground border-border hover:bg-muted">
              Learn More
            </HeroButton>
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
