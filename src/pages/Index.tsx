import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimoniesSection from "@/components/TestimoniesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <main>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <TestimoniesSection />
      <CTASection />
    </main>
    <Footer />
  </div>
);

export default Index;
