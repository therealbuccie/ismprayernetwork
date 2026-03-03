import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCampaigns } from "@/hooks/useCampaigns";

const CampaignCard = () => {
  const { data: campaigns } = useCampaigns();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();

  const activeCampaign = campaigns?.[0];
  const images = activeCampaign?.images ?? [];

  const next = useCallback(() => {
    if (images.length === 0) return;
    setDirection(1);
    setCurrent((c) => (c + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    if (images.length === 0) return;
    setDirection(-1);
    setCurrent((c) => (c - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, images.length]);

  if (!activeCampaign || images.length === 0) return null;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-4 text-sm">
            🔥 {activeCampaign.title}
          </div>
          {activeCampaign.description && (
            <p className="text-muted-foreground max-w-lg mx-auto">
              {activeCampaign.description}
            </p>
          )}
        </motion.div>

        <div
          className="relative max-w-2xl mx-auto cursor-pointer group"
          onClick={() => navigate(activeCampaign.link_url)}
        >
          <div className="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-square rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/50 group-hover:ring-accent/40 transition-all">
            <AnimatePresence custom={direction} mode="wait">
              <motion.img
                key={current}
                src={images[current]}
                alt={`${activeCampaign.title} ${current + 1}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background/90 transition-colors z-10"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background/90 transition-colors z-10"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              </>
            )}

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setDirection(i > current ? 1 : -1); setCurrent(i); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === current ? "bg-accent w-6" : "bg-background/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4 group-hover:text-accent transition-colors">
            Tap to view in bookstore →
          </p>
        </div>
      </div>
    </section>
  );
};

export default CampaignCard;
