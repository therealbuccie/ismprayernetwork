import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import AutoPlayVideo from "@/components/AutoPlayVideo";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Programs = () => {
  const { data: programs, isLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const upcoming = programs?.filter((p: any) => p.is_upcoming) ?? [];
  const past = programs?.filter((p: any) => !p.is_upcoming) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Our <span className="gold-gradient">Programs</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stay updated with upcoming ministry events and programs.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">Loading programs...</div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-serif font-bold mb-6">Upcoming Programs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcoming.map((prog: any, i: number) => (
                      <motion.div key={prog.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <GlassCard className="h-full">
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
                          {prog.description && <p className="text-sm text-muted-foreground mt-3">{prog.description}</p>}
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {past.length > 0 && (
                <section>
                  <h2 className="text-2xl font-serif font-bold mb-6">Past Programs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {past.map((prog: any, i: number) => (
                      <motion.div key={prog.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <GlassCard className="h-full opacity-75">
                          <h3 className="text-lg font-serif font-bold">{prog.title}</h3>
                          {prog.event_date && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar size={14} /> {format(new Date(prog.event_date), "PPP")}
                            </p>
                          )}
                          {prog.description && <p className="text-sm text-muted-foreground mt-2">{prog.description}</p>}
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {!upcoming.length && !past.length && (
                <div className="text-center text-muted-foreground py-12">
                  <Calendar className="mx-auto mb-4 text-accent" size={48} />
                  <p>No programs yet. Check back soon!</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Programs;
