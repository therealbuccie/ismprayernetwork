import { motion } from "framer-motion";
import { Globe, Users, BookOpen, MessageCircle, Video, Flame, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import brandingCollage from "@/assets/branding-collage.png";
import bannerPrayerNetwork from "@/assets/banner-prayer-network.png";
import bannerInsideIsm from "@/assets/banner-inside-ism.png";
import bannerDigitalLibrary from "@/assets/banner-digital-library.png";
import bannerOnlineSchool from "@/assets/banner-online-school.png";
import bannerIsmApp from "@/assets/banner-ism-app.png";
import bannerStandingGap from "@/assets/banner-standing-gap.png";
import bannerMasterClass from "@/assets/banner-master-class.png";

const banners = [
  { src: brandingCollage, alt: "ISM Ministers Prayer Network community" },
  { src: bannerPrayerNetwork, alt: "ISM Prayer Network" },
  { src: bannerInsideIsm, alt: "Inside ISM" },
  { src: bannerDigitalLibrary, alt: "ISM Digital Library" },
  { src: bannerOnlineSchool, alt: "ISM Online School" },
  { src: bannerIsmApp, alt: "ISM App" },
  { src: bannerStandingGap, alt: "Standing in the Gap" },
  { src: bannerMasterClass, alt: "ISM Master Class" },
];

const features = [
  {
    icon: Globe,
    title: "Global Prayer Map",
    description: "See prayer activity across the world in real-time.",
    link: "/global-prayer-map",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Users,
    title: "Prayer Groups",
    description: "Create or join groups for focused intercession.",
    link: "/groups",
    color: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: BookOpen,
    title: "Prayer Points",
    description: "Structured and guided prayer sessions.",
    link: "/prayer-points",
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: MessageCircle,
    title: "Prayer Requests",
    description: "Submit and respond to requests from ministers globally.",
    link: "/prayer-requests",
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: Video,
    title: "Video Testimonies",
    description: "Share powerful testimonies of answered prayers.",
    link: "/testimonies",
    color: "from-rose-500/20 to-red-500/20",
    iconColor: "text-rose-400",
  },
  {
    icon: Flame,
    title: "Prayer Room",
    description: "A dedicated space for worship and spiritual connection.",
    link: "/prayer-room",
    color: "from-yellow-500/20 to-amber-500/20",
    iconColor: "text-yellow-400",
  },
];

const FeaturesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      <div className="relative container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border border-accent/30 text-accent mb-6 bg-accent/5">
            Our Platform
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-5 leading-tight">
            Everything You Need to
            <br />
            <span className="gold-gradient">Pray Together</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-base md:text-lg">
            Unite ministers of the gospel in prayer, fellowship, and shared testimonies.
          </p>
        </motion.div>

        {/* Immersive carousel with tilted perspective */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <div className="relative" style={{ perspective: '1200px' }}>
            <Carousel
              opts={{ loop: true, align: "center" }}
              plugins={[Autoplay({ delay: 3500, stopOnInteraction: false })]}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {banners.map((banner, idx) => (
                  <CarouselItem key={idx} className="pl-4">
                    <motion.div
                      whileHover={{ scale: 1.02, rotateY: 0 }}
                      className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] aspect-video group"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <img
                        src={banner.src}
                        alt={banner.alt}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {/* Bottom label */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-white text-sm font-medium drop-shadow-lg">{banner.alt}</p>
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-5 md:-left-14 w-10 h-10 border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground" />
              <CarouselNext className="hidden sm:flex -right-5 md:-right-14 w-10 h-10 border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground" />
            </Carousel>

            {/* Dots / progress indicator */}
            <div className="flex justify-center gap-1.5 mt-6">
              {banners.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/30" />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Feature cards — bento-style grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              onClick={() => navigate(feature.link)}
              className={`group relative rounded-2xl border border-border/50 bg-gradient-to-br ${feature.color} backdrop-blur-sm p-6 cursor-pointer overflow-hidden transition-all duration-300 hover:border-accent/40 hover:shadow-[0_8px_30px_-12px] hover:shadow-accent/20 hover:-translate-y-1`}
            >
              {/* Glow effect on hover */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className={`w-11 h-11 rounded-xl bg-background/80 border border-border/50 flex items-center justify-center mb-4 ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={20} />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-1.5 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{feature.description}</p>
                <div className="flex items-center gap-1.5 text-xs font-medium text-accent opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-300">
                  Explore <ArrowRight size={12} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
