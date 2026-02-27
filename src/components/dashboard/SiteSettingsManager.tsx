import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSetting, BankDetails } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Banknote } from "lucide-react";

export function SiteSettingsManager() {
  const { data: bankDetails, isLoading } = useSiteSettings("bank_details") as { data: BankDetails | undefined; isLoading: boolean };
  const updateSetting = useUpdateSiteSetting();
  const [form, setForm] = useState<BankDetails>({ bank_name: "", account_number: "", account_name: "" });

  useEffect(() => {
    if (bankDetails) setForm(bankDetails);
  }, [bankDetails]);

  const handleSave = async () => {
    if (!form.bank_name || !form.account_number || !form.account_name) {
      toast.error("All fields are required");
      return;
    }
    try {
      await updateSetting.mutateAsync({ key: "bank_details", value: form });
      toast.success("Bank details updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Site Settings</h1>

      <div className="rounded-xl border border-border bg-card p-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-accent" /> Bank Transfer Details
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          These details are shown to users during checkout when they select bank transfer.
        </p>
        <div className="space-y-4">
          <div>
            <Label>Bank Name</Label>
            <Input value={form.bank_name} onChange={e => setForm(prev => ({ ...prev, bank_name: e.target.value }))} />
          </div>
          <div>
            <Label>Account Number</Label>
            <Input value={form.account_number} onChange={e => setForm(prev => ({ ...prev, account_number: e.target.value }))} />
          </div>
          <div>
            <Label>Account Name</Label>
            <Input value={form.account_name} onChange={e => setForm(prev => ({ ...prev, account_name: e.target.value }))} />
          </div>
          <Button onClick={handleSave} disabled={updateSetting.isPending} className="gap-2">
            <Save size={16} /> {updateSetting.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
