import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { isPublicDashboard, adminQuery, adminUpsert } from "@/hooks/useBookstoreAdmin";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Tv } from "lucide-react";

export function LiveTVManager() {
  const isPublic = isPublicDashboard();
  const updateSetting = useUpdateSiteSetting();

  const directHls = useSiteSettings("hls_url");
  const publicHls = useQuery({
    queryKey: ["public-site-settings-hls"],
    queryFn: async () => {
      const data = await adminQuery("site_settings", "*", [{ op: "eq", column: "key", value: "hls_url" }]);
      if (data && data.length > 0) return data[0].value as string;
      return "";
    },
    enabled: isPublic,
  });
  const hlsUrl = isPublic ? publicHls.data : directHls.data;
  const isLoading = isPublic ? publicHls.isLoading : directHls.isLoading;

  const [hlsForm, setHlsForm] = useState("");

  useEffect(() => {
    if (hlsUrl) setHlsForm(hlsUrl as string);
  }, [hlsUrl]);

  const handleSave = async () => {
    try {
      if (isPublic) {
        await adminUpsert("site_settings", { key: "hls_url", value: hlsForm }, "key");
      } else {
        await updateSetting.mutateAsync({ key: "hls_url", value: hlsForm });
      }
      toast.success("Live TV URL updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Tv className="w-7 h-7 text-accent" /> Live TV Settings
      </h1>
      <div className="rounded-xl border border-border bg-card p-6 max-w-lg">
        <p className="text-sm text-muted-foreground mb-4">
          Enter the HLS (.m3u8) stream URL for the Live TV page.
        </p>
        <div className="space-y-4">
          <div>
            <Label>HLS Stream URL</Label>
            <Input value={hlsForm} onChange={e => setHlsForm(e.target.value)} placeholder="https://example.com/stream.m3u8" />
          </div>
          <Button onClick={handleSave} disabled={updateSetting.isPending} className="gap-2">
            <Save size={16} /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}
