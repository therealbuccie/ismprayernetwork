import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import RouteSeo from "./components/RouteSeo";
import FloatingTranslate from "./components/FloatingTranslate";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PrayerRequests from "./pages/PrayerRequests";
import PrayerGroups from "./pages/PrayerGroups";
import JoinGroup from "./pages/JoinGroup";
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
import JoinPrayerRoom from "./pages/JoinPrayerRoom";
import MyLibrary from "./pages/MyLibrary";
import NotFound from "./pages/NotFound";
import ApiDocs from "./pages/ApiDocs";
import Archives from "./pages/Archives";
import Unsubscribe from "./pages/Unsubscribe";
import SubmitReport from "./pages/SubmitReport";
import ApiKeyDocument from "./pages/ApiKeyDocument";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
      <CartProvider>
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
            <Route path="/groups/:slug" element={<JoinGroup />} />
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
            <Route path="/my-library" element={<MyLibrary />} />
            <Route path="/prayer-room/:slug" element={<JoinPrayerRoom />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/api-key-doc" element={<ApiKeyDocument />} />
            <Route path="/archives" element={<Archives />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/report" element={<SubmitReport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
