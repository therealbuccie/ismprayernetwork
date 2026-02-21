import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const Partner = () => (
  <div className="h-screen flex flex-col bg-background overflow-hidden">
    <Navbar />

    {/* Compact header */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-2 px-4 pt-[68px] shrink-0"
    >
      <div className="flex items-center justify-center gap-2">
        <Heart className="text-accent" size={20} />
        <h1 className="text-xl md:text-2xl font-serif font-bold">
          Partner <span className="gold-gradient">With Us</span>
        </h1>
      </div>
    </motion.div>

    {/* Full iframe */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="flex-1 min-h-0"
    >
      <iframe
        src="https://christembassy-ism.org/onlinepay/seeds.php"
        title="Partner - Give to ISM Ministers Prayer Network"
        className="w-full h-full border-0"
        allow="payment"
      />
    </motion.div>
  </div>
);

export default Partner;
