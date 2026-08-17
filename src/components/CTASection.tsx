import { motion } from "framer-motion";
import { HeroButton } from "./HeroButton";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import brandingJoin from "@/assets/branding-join.png";

const CTASection = () => {
  const { user } = useAuth();
  return (
  <section className="py-24 bg-background overflow-hidden">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl overflow-hidden shadow-2xl order-2 lg:order-1"
        >
          <img
            src={brandingJoin}
            alt="Join ISM Ministers Prayer Network"
            className="w-full h-auto object-cover"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left order-1 lg:order-2"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Join the Global Ministers' Prayer Movement
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
            Be part of a worldwide community of ministers of the gospel lifting up prayers 24/7.
            Your intercession can transform nations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link to="/prayer-room">
              <HeroButton variant="gold" size="lg" className="text-accent-foreground">
                Start Praying Today
              </HeroButton>
            </Link>
            <Link to={user ? "/groups" : "/join"}>
              <HeroButton variant="outline" size="lg" className="text-foreground border-border hover:bg-muted">
                {user ? "Join a Prayer Group" : "Join the Network"}
              </HeroButton>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
  );
};

export default CTASection;
