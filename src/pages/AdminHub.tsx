import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { LayoutDashboard, Flame, LogOut, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const dashboards = [
  {
    id: "site",
    title: "Site Dashboard",
    description: "Manage books, users, testimonies, messages, and categories.",
    icon: LayoutDashboard,
    path: "/dashboard",
    gradient: "from-primary/20 to-accent/10",
    iconColor: "text-primary",
  },
  {
    id: "prayer",
    title: "Prayer Room Dashboard",
    description: "Manage live prayer sessions, controls, and participants.",
    icon: Flame,
    path: "/prayer-dashboard",
    gradient: "from-accent/20 to-orange-500/10",
    iconColor: "text-accent",
  },
];

const AdminHub = () => {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || (profile && !isAdmin))) {
      navigate("/auth");
    }
  }, [loading, user, profile, isAdmin, navigate]);

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-9 w-9 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">
                Welcome, {profile?.full_name || profile?.email || "Admin"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Site
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-3xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-foreground mb-2">Choose a Dashboard</h2>
            <p className="text-muted-foreground">Select which area you'd like to manage.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {dashboards.map((d, i) => (
              <motion.button
                key={d.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                onClick={() => navigate(d.path)}
                className={`group relative rounded-2xl border border-border/60 bg-gradient-to-br ${d.gradient} p-8 text-left hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300`}
              >
                <div className={`w-14 h-14 rounded-xl bg-background/80 border border-border/40 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${d.iconColor}`}>
                  <d.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{d.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-accent text-sm font-medium">
                  Open →
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminHub;
