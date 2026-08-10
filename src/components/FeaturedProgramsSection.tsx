import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight, Play } from "lucide-react";
import { format } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const isYouTube = (url: string) =>
  url.includes("youtube.com/watch") || url.includes("youtu.be/");

const getYouTubeEmbedUrl = (url: string) => {
  let videoId = "";
  if (url.includes("youtube.com/watch")) {
    videoId = new URL(url).searchParams.get("v") || "";
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
  }
  return `https://www.youtube.com/embed/${videoId}?mute=1&autoplay=0&modestbranding=1&rel=0&fs=0&iv_load_policy=3`;
};

const VideoPlayer = ({ url, title }: { url: string; title: string }) => {
  if (isYouTube(url)) {
    return (
      <iframe
        src={getYouTubeEmbedUrl(url)}
        className="w-full h-full border-0"
        style={{ overflow: "hidden" }}
        scrolling="no"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title}
      />
    );
  }
  return (
    <video
      src={url}
      className="w-full h-full object-cover"
      muted
      autoPlay
      loop
      playsInline
      controlsList="nodownload"
      disablePictureInPicture
    />
  );
};

const FeaturedProgramsSection = () => {
  const { data: programs } = useQuery({
    queryKey: ["featured-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("is_upcoming", true)
        .order("event_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      const now = new Date().toISOString();
      return (data ?? []).filter((p: any) => !p.event_date || p.event_date >= now).slice(0, 4);
    },
  });

  if (!programs?.length) return null;

  const hero = programs[0];
  const rest = programs.slice(1);


  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4 tracking-wide uppercase">
            Don't Miss Out
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-3">
            Upcoming <span className="gold-gradient">Programs</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Join us for powerful ministry events and programs.
          </p>
        </motion.div>

        {/* Hero program card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="rounded-2xl overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Video / Image side */}
              <div className="relative bg-black">
                {hero.video_url ? (
                  <AspectRatio ratio={16 / 9}>
                    <VideoPlayer url={hero.video_url} title={hero.title} />
                  </AspectRatio>
                ) : hero.image_url ? (
                  <AspectRatio ratio={16 / 9}>
                    <img
                      src={hero.image_url}
                      alt={hero.title}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                ) : (
                  <AspectRatio ratio={16 / 9}>
                    <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <Play className="text-accent" size={48} />
                    </div>
                  </AspectRatio>
                )}
              </div>

              {/* Info side */}
              <div className="p-8 lg:p-10 flex flex-col justify-center">
                <span className="inline-block w-fit px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
                  Featured
                </span>
                <h3 className="text-2xl lg:text-3xl font-serif font-bold text-foreground mb-4">
                  {hero.title}
                </h3>
                {hero.event_date && (
                  <p className="text-accent font-medium flex items-center gap-2 mb-2">
                    <Calendar size={16} />
                    {format(new Date(hero.event_date), "MMMM do, yyyy 'at' h:mm a")}
                  </p>
                )}
                {hero.location && (
                  <p className="text-muted-foreground flex items-center gap-2 mb-4">
                    <MapPin size={16} /> {hero.location}
                  </p>
                )}
                {hero.description && (
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {hero.description}
                  </p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <Link to="/programs">
                    <Button className="gap-2 w-fit bg-accent hover:bg-accent/90 text-accent-foreground">
                      Learn More <ArrowRight size={16} />
                    </Button>
                  </Link>
                  {hero.registration_url && (
                    <a href={hero.registration_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="gap-2 w-fit border-accent/30 hover:bg-accent/10 hover:text-accent">
                        Register Now <ArrowRight size={16} />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Secondary program cards */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((prog: any, i: number) => (
              <motion.div
                key={prog.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="group rounded-xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur-sm hover:border-accent/30 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  {prog.video_url ? (
                    <div className="relative bg-black">
                      <AspectRatio ratio={16 / 9}>
                        <VideoPlayer url={prog.video_url} title={prog.title} />
                      </AspectRatio>
                    </div>
                  ) : prog.image_url ? (
                    <AspectRatio ratio={16 / 9}>
                      <img
                        src={prog.image_url}
                        alt={prog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </AspectRatio>
                  ) : null}

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-serif font-bold text-foreground group-hover:text-accent transition-colors">
                      {prog.title}
                    </h3>
                    {prog.event_date && (
                      <p className="text-sm text-accent flex items-center gap-1.5 mt-2 font-medium">
                        <Calendar size={14} />
                        {format(new Date(prog.event_date), "MMM do, yyyy 'at' h:mm a")}
                      </p>
                    )}
                    {prog.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <MapPin size={14} /> {prog.location}
                      </p>
                    )}
                    {prog.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                        {prog.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/programs">
            <Button variant="outline" className="gap-2 border-accent/30 hover:bg-accent/10 hover:text-accent">
              View All Programs <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProgramsSection;
