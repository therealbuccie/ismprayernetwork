import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const Partner = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <div className="flex-1 flex flex-col pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-4 px-4"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Heart className="text-accent" size={24} />
          <h1 className="text-2xl md:text-3xl font-serif font-bold">
            Partner <span className="gold-gradient">With Us</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Sow a seed and partner with ISM Ministers Prayer Network to spread the gospel worldwide.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1"
      >
        <iframe
          src="https://christembassy-ism.org/onlinepay/seeds.php"
          title="Partner - Give to ISM Ministers Prayer Network"
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 140px)" }}
          allow="payment"
        />
      </motion.div>
    </div>
  </div>
);

export default Partner;
