import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "./GlassCard";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FeaturedProgramsSection = () => {
  const { data: programs } = useQuery({
    queryKey: ["featured-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("is_upcoming", true)
        .order("event_date", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  if (!programs?.length) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-3">
            Upcoming <span className="gold-gradient">Programs</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Don't miss our upcoming ministry events and programs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((prog: any, i: number) => (
            <motion.div key={prog.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <GlassCard className="h-full flex flex-col">
                {prog.video_url ? (
                  <AspectRatio ratio={16 / 9} className="mb-4 rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={prog.video_url.includes("youtube.com/watch") ? prog.video_url.replace("watch?v=", "embed/") : prog.video_url.includes("youtu.be/") ? `https://www.youtube.com/embed/${prog.video_url.split("youtu.be/")[1]}` : prog.video_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={prog.title}
                    />
                  </AspectRatio>
                ) : prog.image_url ? (
                  <img src={prog.image_url} alt={prog.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                ) : null}
                <h3 className="text-xl font-serif font-bold">{prog.title}</h3>
                {prog.event_date && (
                  <p className="text-sm text-accent flex items-center gap-1 mt-2">
                    <Calendar size={14} /> {format(new Date(prog.event_date), "PPP 'at' p")}
                  </p>
                )}
                {prog.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin size={14} /> {prog.location}
                  </p>
                )}
                {prog.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{prog.description}</p>}
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/programs">
            <Button variant="outline" className="gap-2">
              View All Programs <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProgramsSection;
