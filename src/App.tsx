import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import FloatingTranslate from "./components/FloatingTranslate";
import { CartProvider } from "./contexts/CartContext";
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
import JoinPrayerRoom from "./pages/JoinPrayerRoom";
import MyLibrary from "./pages/MyLibrary";
import NotFound from "./pages/NotFound";
import ApiDocs from "./pages/ApiDocs";
import ProtectedRoute from "./components/ProtectedRoute";

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
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <FloatingTranslate />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/prayer-requests" element={<ProtectedRoute><PrayerRequests /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><PrayerGroups /></ProtectedRoute>} />
            <Route path="/prayer-room" element={<ProtectedRoute><PrayerRoom /></ProtectedRoute>} />
            <Route path="/testimonies" element={<Testimonies />} />
            <Route path="/live-tv" element={<LiveTV />} />
            <Route path="/partner" element={<Partner />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/bookstore" element={<Bookstore />} />
            <Route path="/global-prayer-map" element={<ProtectedRoute><GlobalPrayerMap /></ProtectedRoute>} />
            <Route path="/prayer-points" element={<ProtectedRoute><PrayerPoints /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminHub /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/prayer-dashboard" element={<ProtectedRoute><PrayerDashboard /></ProtectedRoute>} />
            <Route path="/api/dashboard" element={<PublicDashboard />} />
            <Route path="/api/prayer-dashboard" element={<PublicPrayerDashboard />} />
            <Route path="/api/bookstore" element={<PublicBookstoreDashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/about" element={<About />} />
            <Route path="/our-impact" element={<OurImpact />} />
            <Route path="/radio" element={<OnlineRadio />} />
            <Route path="/my-library" element={<ProtectedRoute><MyLibrary /></ProtectedRoute>} />
            <Route path="/prayer-room/:slug" element={<ProtectedRoute><JoinPrayerRoom /></ProtectedRoute>} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
