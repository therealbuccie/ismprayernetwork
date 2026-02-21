import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const Partner = () => (
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
            <Heart className="text-accent" size={28} />
            <h1 className="text-3xl md:text-4xl font-serif font-bold">
              Partner <span className="gold-gradient">With Us</span>
            </h1>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Sow a seed and partner with ISM Ministers Prayer Network to spread the gospel worldwide.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto rounded-xl overflow-hidden border border-border/50 bg-card"
          style={{ minHeight: "700px" }}
        >
          <iframe
            src="https://christembassy-ism.org/onlinepay/seeds.php"
            title="Partner - Give to ISM Ministers Prayer Network"
            className="w-full border-0"
            style={{ minHeight: "700px", height: "100%" }}
            allow="payment"
          />
        </motion.div>
      </div>
    </div>
    <Footer />
  </div>
);

export default Partner;
