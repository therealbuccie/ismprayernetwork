import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PublicPrayerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Site
          </button>
          <span className="text-sm font-semibold text-foreground">Prayer Room Dashboard</span>
        </div>
      </header>
      <main className="flex-1">
        <iframe
          src="https://jcontrol.pro/embed?session=ism-prayer-network"
          className="w-full h-[calc(100vh-57px)] border-0"
          title="Prayer Room Dashboard"
          allow="microphone; camera; fullscreen"
        />
      </main>
    </div>
  );
};

export default PublicPrayerDashboard;
