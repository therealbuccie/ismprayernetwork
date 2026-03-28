import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import AuthGateModal from "@/components/AuthGateModal";

const PrayerDashboard = () => {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuth(true);
    }
  }, [loading, user]);

  useEffect(() => {
    if (!loading && user && profile && !isAdmin) {
      navigate("/");
    }
  }, [loading, user, profile, isAdmin, navigate]);

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Prayer Room Dashboard</h1>
          <p className="text-muted-foreground text-sm">Sign in as an admin to access the dashboard.</p>
        </div>
        <AuthGateModal
          open={showAuth}
          onOpenChange={(open) => {
            setShowAuth(open);
            if (!open) navigate("/");
          }}
          title="Admin Sign In"
          description="Sign in to access the Prayer Room Dashboard"
        />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Hub
          </button>
          <span className="text-sm font-semibold text-foreground">Prayer Room Dashboard</span>
        </div>
      </header>
      <main className="flex-1">
        <iframe
          src="https://jcontrol.pro/auth?session=ism-prayer-network"
          className="w-full h-[calc(100vh-57px)] border-0"
          title="Prayer Room Dashboard"
          allow="microphone; camera; fullscreen"
        />
      </main>
    </div>
  );
};

export default PrayerDashboard;
