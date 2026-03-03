import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const promoImages = [
  "/images/promo-prayer-2.jpeg",
  "/images/promo-prayer-3.jpeg",
  "/images/promo-prayer-4.jpeg",
];

const ELIBRARY_URL = "https://elibrary.loveworldbooks.org/register/ism";

interface PrayerRendezvousPromoProps {
  /** "banner" = wide horizontal (bookstore hero area), "card" = compact card (homepage) */
  variant?: "banner" | "card";
}

const PrayerRendezvousPromo = ({ variant = "banner" }: PrayerRendezvousPromoProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % promoImages.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + promoImages.length) % promoImages.length);
  }, []);

  // Auto-rotate every 5s
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  if (variant === "card") {
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
              🔥 Limited Campaign
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Prayer <span className="gold-gradient">Rendezvous</span> Combo
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Get 3 powerful books on prayer &amp; prophecy — available on the E-Library.
            </p>
          </motion.div>

          <div className="relative max-w-2xl mx-auto">
            <div className="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <AnimatePresence custom={direction} mode="wait">
                <motion.img
                  key={current}
                  src={promoImages[current]}
                  alt={`Prayer Rendezvous promo ${current + 1}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Nav arrows */}
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background/90 transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background/90 transition-colors z-10"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {promoImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === current ? "bg-accent w-6" : "bg-background/60"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <a
                href={ELIBRARY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full gold-gradient-bg text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-shadow text-sm"
              >
                Get the Combo on E-Library <ExternalLink className="w-4 h-4" />
              </a>
              <Link
                to="/bookstore"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-foreground font-medium hover:bg-muted transition-colors text-sm"
              >
                Browse Our Bookstore
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Banner variant – horizontal for bookstore
  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xl">
      <div className="relative aspect-[16/9] sm:aspect-[2/1] md:aspect-[5/2]">
        <AnimatePresence custom={direction} mode="wait">
          <motion.img
            key={current}
            src={promoImages[current]}
            alt={`Prayer Rendezvous promo ${current + 1}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />

        {/* Nav arrows */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors z-10"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors z-10"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {promoImages.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === current ? "bg-accent w-6" : "bg-background/60"
              }`}
            />
          ))}
        </div>

        {/* CTA overlay */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:block">
          <a
            href={ELIBRARY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gold-gradient-bg text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-shadow text-sm"
          >
            Get on E-Library <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Mobile CTA below banner */}
      <div className="sm:hidden p-4 bg-card text-center">
        <a
          href={ELIBRARY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gold-gradient-bg text-accent-foreground font-semibold shadow-lg text-sm"
        >
          Get on E-Library <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default PrayerRendezvousPromo;
