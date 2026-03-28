import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { BookOpen, Flame, Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PrayerPoint {
  id: string;
  category: string;
  title: string;
  scripture: string;
  body: string;
  sort_order: number;
}

const PrayerPoints = () => {
  const { data: rawPoints = [], isLoading } = useQuery({
    queryKey: ["prayer-points"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_points")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as PrayerPoint[];
    },
  });

  // Group by category
  const prayerPoints = Object.entries(
    rawPoints.reduce<Record<string, PrayerPoint[]>>((acc, p) => {
      (acc[p.category] = acc[p.category] || []).push(p);
      return acc;
    }, {})
  ).map(([category, points]) => ({ category, points }));

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Auto-expand first category when data loads
  const firstCat = prayerPoints[0]?.category ?? null;
  if (firstCat && expandedCategory === null && prayerPoints.length > 0) {
    setExpandedCategory(firstCat);
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16">
        <div className="hero-gradient py-10 px-4">
          <div className="container mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <BookOpen size={48} className="mx-auto text-accent mb-4" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground mb-2">
                Prayer <span className="gold-gradient">Points</span>
              </h1>
              <p className="text-primary-foreground/70 max-w-xl mx-auto">
                Structured and guided prayer sessions for ministers around the world.
              </p>
              <p className="text-primary-foreground/50 text-sm mt-2 flex items-center justify-center gap-1.5">
                <Calendar size={14} /> {today}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : prayerPoints.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No prayer points available yet.</div>
        ) : (
        <div className="space-y-4">
          {prayerPoints.map((cat, ci) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.08 }}
              className="glass-card rounded-xl border border-border/50 overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gold-gradient-bg flex items-center justify-center">
                    <Flame size={18} className="text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base">{cat.category}</h3>
                    <p className="text-xs text-muted-foreground">{cat.points.length} prayer points</p>
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-muted-foreground transition-transform ${expandedCategory === cat.category ? "rotate-180" : ""}`}
                />
              </button>

              {expandedCategory === cat.category && (
                <div className="px-5 pb-5 space-y-6">
                  {cat.points.map((point, pi) => (
                    <div key={pi} className="border-t border-border/50 pt-4">
                      <h4 className="font-serif font-bold text-sm mb-2 text-foreground leading-snug">{point.title}</h4>
                      <p className="text-xs text-muted-foreground italic mb-3 leading-relaxed border-l-2 border-accent/50 pl-3">
                        {point.scripture}
                      </p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{point.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrayerPoints;
