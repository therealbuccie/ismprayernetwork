import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Globe, MapPin, Flame, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const regions = [
  { name: "Africa", prayers: 1240, groups: 34, color: "from-amber-500 to-orange-600" },
  { name: "Europe", prayers: 860, groups: 22, color: "from-blue-500 to-cyan-600" },
  { name: "North America", prayers: 920, groups: 28, color: "from-emerald-500 to-green-600" },
  { name: "South America", prayers: 540, groups: 15, color: "from-rose-500 to-pink-600" },
  { name: "Asia", prayers: 1100, groups: 31, color: "from-violet-500 to-purple-600" },
  { name: "Oceania", prayers: 320, groups: 9, color: "from-teal-500 to-cyan-600" },
];

const GlobalPrayerMap = () => {
  const { data: totalRequests } = useQuery({
    queryKey: ["total-prayer-requests"],
    queryFn: async () => {
      const { count } = await supabase
        .from("prayer_requests")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: totalGroups } = useQuery({
    queryKey: ["total-prayer-groups"],
    queryFn: async () => {
      const { count } = await supabase
        .from("prayer_groups")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16">
        <div className="hero-gradient py-10 px-4">
          <div className="container mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Globe size={48} className="mx-auto text-accent mb-4" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground mb-2">
                Global Prayer <span className="gold-gradient">Map</span>
              </h1>
              <p className="text-primary-foreground/70 max-w-xl mx-auto">
                See prayer activity across the world in real-time. Ministers from every continent are united in intercession.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Prayer Requests", value: totalRequests ?? 0, icon: Flame },
            { label: "Prayer Groups", value: totalGroups ?? 0, icon: Users },
            { label: "Countries Reached", value: 47, icon: MapPin },
            { label: "Active Regions", value: regions.length, icon: Globe },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-5 text-center border border-border/50"
            >
              <stat.icon size={24} className="mx-auto text-accent mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Regions Grid */}
        <h2 className="font-serif font-bold text-xl mb-6 text-center uppercase tracking-wide">
          Prayer Activity by Region
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {regions.map((region, i) => (
            <motion.div
              key={region.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-xl p-6 border border-border/50 hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${region.color} flex items-center justify-center mb-4`}>
                <MapPin size={22} className="text-white" />
              </div>
              <h3 className="font-serif font-bold text-lg mb-3">{region.name}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Prayers Offered</span>
                  <span className="font-semibold text-foreground">{region.prayers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Groups</span>
                  <span className="font-semibold text-foreground">{region.groups}</span>
                </div>
              </div>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${region.color} rounded-full`}
                  style={{ width: `${(region.prayers / 1300) * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-xl p-6 border border-border/50 max-w-2xl mx-auto text-center">
          <Flame size={28} className="mx-auto text-accent mb-3" />
          <h3 className="font-serif font-bold text-lg mb-2">Join the Movement</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ministers from {regions.length} regions are actively praying. Submit your prayer requests and join a prayer group to be part of this global network.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/prayer-requests" className="px-4 py-2 rounded-lg gold-gradient-bg text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              Submit Prayer Request
            </a>
            <a href="/groups" className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
              Join a Group
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GlobalPrayerMap;
