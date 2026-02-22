import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { Globe, Users, BookOpen, MessageCircle, Video, Shield } from "lucide-react";
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
    description: "See prayer activity across the world in real-time with our interactive map.",
    link: "/global-prayer-map",
  },
  {
    icon: Users,
    title: "Prayer Groups",
    description: "Create or join private and public prayer groups for focused ministerial intercession.",
    link: "/groups",
  },
  {
    icon: BookOpen,
    title: "Prayer Points",
    description: "Access categorised prayer points for structured and guided prayer sessions.",
    link: "/prayer-points",
  },
  {
    icon: MessageCircle,
    title: "Prayer Requests",
    description: "Submit and respond to prayer requests from ministers around the globe.",
    link: "/prayer-requests",
  },
  {
    icon: Video,
    title: "Video Testimonies",
    description: "Share powerful video testimonies of answered prayers and breakthroughs in ministry.",
    link: "/testimonies",
  },
  {
    icon: Shield,
    title: "Admin Dashboard",
    description: "Manage users, content, and prayer activities with a comprehensive admin panel.",
    link: "/dashboard",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  const navigate = useNavigate();
  return (
  <section className="py-24 bg-background">
    <div className="container mx-auto px-4">
      {/* Section header with branding image */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
          Everything You Need to{" "}
          <span className="gold-gradient">Pray Together</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          A complete platform designed to unite ministers of the gospel in prayer, fellowship, and shared testimonies.
        </p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <Carousel
            opts={{ loop: true, align: "center" }}
            plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]}
            className="w-full"
          >
            <CarouselContent>
              {banners.map((banner, idx) => (
                <CarouselItem key={idx}>
                  <div className="rounded-2xl overflow-hidden shadow-2xl aspect-video">
                    <img
                      src={banner.src}
                      alt={banner.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4 md:-left-12" />
            <CarouselNext className="hidden sm:flex -right-4 md:-right-12" />
          </Carousel>
        </motion.div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={item}>
            <GlassCard
              variant="hover"
              className="h-full cursor-pointer"
              onClick={() => navigate(feature.link)}
            >
              <div className="w-12 h-12 rounded-lg gold-gradient-bg flex items-center justify-center mb-4">
                <feature.icon size={22} className="text-accent-foreground" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

};

export default FeaturesSection;
