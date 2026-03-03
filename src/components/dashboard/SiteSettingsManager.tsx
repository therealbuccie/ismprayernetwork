import { Settings } from "lucide-react";

export function SiteSettingsManager() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-7 h-7 text-accent" /> General Settings
      </h1>
      <div className="max-w-lg space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Payment and Live TV settings have been moved to their own dedicated pages in the sidebar under <span className="font-semibold text-foreground">Configuration</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
