import { useState, useRef, useEffect } from "react";
import { Globe, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GoogleTranslate from "./GoogleTranslate";

const FloatingTranslate = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="fixed bottom-20 right-4 z-[999] md:bottom-6 md:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-14 right-0 w-[260px] rounded-xl border border-border/60 bg-popover shadow-xl p-4 overflow-visible"
            style={{ zIndex: 99999 }}
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">🌐 Translate Page</p>
            <div className="overflow-visible">
              <GoogleTranslate />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200"
        aria-label="Translate page"
      >
        {open ? <X size={20} /> : <Globe size={20} />}
      </button>
    </div>
  );
};

export default FloatingTranslate;
