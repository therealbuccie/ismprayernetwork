import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
