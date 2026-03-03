import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSetting, BankDetails } from "@/hooks/useSiteSettings";
import { isPublicDashboard, adminQuery, adminUpsert } from "@/hooks/useBookstoreAdmin";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Banknote, Tv } from "lucide-react";

export function SiteSettingsManager() {
  const isPublic = isPublicDashboard();

  // Bank details
  const directSettings = useSiteSettings("bank_details");
  const publicSettings = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: async () => {
      const data = await adminQuery("site_settings", "*", [{ op: "eq", column: "key", value: "bank_details" }]);
      if (data && data.length > 0) return data[0].value as BankDetails;
      return null;
    },
    enabled: isPublic,
  });
  const bankDetails = isPublic ? publicSettings.data : directSettings.data;

  // HLS URL
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

  const isLoading = isPublic ? publicSettings.isLoading : (directSettings.isLoading || directHls.isLoading);

  const updateSetting = useUpdateSiteSetting();
  const [form, setForm] = useState<BankDetails>({ bank_name: "", account_number: "", account_name: "" });
  const [hlsForm, setHlsForm] = useState("");

  useEffect(() => {
    if (bankDetails) setForm(bankDetails as BankDetails);
  }, [bankDetails]);

  useEffect(() => {
    if (hlsUrl) setHlsForm(hlsUrl as string);
  }, [hlsUrl]);

  const handleSave = async () => {
    if (!form.bank_name || !form.account_number || !form.account_name) {
      toast.error("All fields are required");
      return;
    }
    try {
      if (isPublic) {
        await adminUpsert("site_settings", { key: "bank_details", value: form }, "key");
      } else {
        await updateSetting.mutateAsync({ key: "bank_details", value: form });
      }
      toast.success("Bank details updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveHls = async () => {
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
      <h1 className="text-3xl font-bold mb-6">Site Settings</h1>

      <div className="space-y-8 max-w-lg">
        {/* Bank Details */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-accent" /> Bank Transfer Details
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            These details are shown to users during checkout when they select bank transfer.
          </p>
          <div className="space-y-4">
            <div><Label>Bank Name</Label><Input value={form.bank_name} onChange={e => setForm(prev => ({ ...prev, bank_name: e.target.value }))} /></div>
            <div><Label>Account Number</Label><Input value={form.account_number} onChange={e => setForm(prev => ({ ...prev, account_number: e.target.value }))} /></div>
            <div><Label>Account Name</Label><Input value={form.account_name} onChange={e => setForm(prev => ({ ...prev, account_name: e.target.value }))} /></div>
            <Button onClick={handleSave} disabled={updateSetting.isPending} className="gap-2">
              <Save size={16} /> Save
            </Button>
          </div>
        </div>

        {/* HLS TV URL */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Tv className="w-5 h-5 text-accent" /> Live TV Stream URL
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the HLS (.m3u8) stream URL for the Live TV page.
          </p>
          <div className="space-y-4">
            <div><Label>HLS Stream URL</Label><Input value={hlsForm} onChange={e => setHlsForm(e.target.value)} placeholder="https://example.com/stream.m3u8" /></div>
            <Button onClick={handleSaveHls} disabled={updateSetting.isPending} className="gap-2">
              <Save size={16} /> Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
