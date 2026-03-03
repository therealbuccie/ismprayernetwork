import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimoniesSection from "@/components/TestimoniesSection";
import CTASection from "@/components/CTASection";
import FeaturedBooksSection from "@/components/FeaturedBooksSection";
import PrayerRendezvousPromo from "@/components/PrayerRendezvousPromo";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";

const Index = () => {
  const [loading, setLoading] = useState(() => !sessionStorage.getItem("preloaderShown"));

  // Pre-cache the hero video on first visit
  useEffect(() => {
    if ("caches" in window) {
      caches.open("hero-video-v1").then((cache) => {
        cache.match("/video/hero-bg.mp4").then((res) => {
          if (!res) {
            cache.add("/video/hero-bg.mp4").catch(() => {});
          }
        });
      });
    }
  }, []);

  const handlePreloaderComplete = useCallback(() => {
    sessionStorage.setItem("preloaderShown", "1");
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen">
      {loading && <Preloader onComplete={handlePreloaderComplete} />}
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedBooksSection />
        <PrayerRendezvousPromo variant="card" />
        <StatsSection />
        <FeaturesSection />
        <TestimoniesSection />
        <NewsletterSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
