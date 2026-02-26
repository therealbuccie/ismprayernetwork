import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import FloatingTranslate from "./components/FloatingTranslate";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PrayerRequests from "./pages/PrayerRequests";
import PrayerGroups from "./pages/PrayerGroups";
import PrayerRoom from "./pages/PrayerRoom";
import Testimonies from "./pages/Testimonies";
import Contact from "./pages/Contact";
import Bookstore from "./pages/Bookstore";
import LiveTV from "./pages/LiveTV";
import Partner from "./pages/Partner";
import Dashboard from "./pages/Dashboard";
import GlobalPrayerMap from "./pages/GlobalPrayerMap";
import PrayerPoints from "./pages/PrayerPoints";
import Events from "./pages/Events";
import Programs from "./pages/Programs";
import About from "./pages/About";
import OurImpact from "./pages/OurImpact";
import AdminHub from "./pages/AdminHub";
import PrayerDashboard from "./pages/PrayerDashboard";
import PublicDashboard from "./pages/PublicDashboard";
import PublicPrayerDashboard from "./pages/PublicPrayerDashboard";
import PublicBookstoreDashboard from "./pages/PublicBookstoreDashboard";
import OnlineRadio from "./pages/OnlineRadio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <FloatingTranslate />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/prayer-requests" element={<PrayerRequests />} />
          <Route path="/groups" element={<PrayerGroups />} />
          <Route path="/prayer-room" element={<PrayerRoom />} />
          <Route path="/testimonies" element={<Testimonies />} />
          <Route path="/live-tv" element={<LiveTV />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/bookstore" element={<Bookstore />} />
          <Route path="/global-prayer-map" element={<GlobalPrayerMap />} />
          <Route path="/prayer-points" element={<PrayerPoints />} />
          <Route path="/admin" element={<AdminHub />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/prayer-dashboard" element={<PrayerDashboard />} />
          <Route path="/api/dashboard" element={<PublicDashboard />} />
          <Route path="/api/prayer-dashboard" element={<PublicPrayerDashboard />} />
          <Route path="/api/bookstore" element={<PublicBookstoreDashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/about" element={<About />} />
          <Route path="/our-impact" element={<OurImpact />} />
          <Route path="/radio" element={<OnlineRadio />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
