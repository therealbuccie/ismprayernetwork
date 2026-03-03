import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSetting, BankDetails } from "@/hooks/useSiteSettings";
import { isPublicDashboard, adminQuery, adminUpsert } from "@/hooks/useBookstoreAdmin";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Banknote, Plus, Trash2, Wallet } from "lucide-react";

export function PaymentSettingsManager() {
  const isPublic = isPublicDashboard();
  const updateSetting = useUpdateSiteSetting();

  // Bank accounts (array)
  const directBanks = useSiteSettings("bank_accounts");
  const publicBanks = useQuery({
    queryKey: ["public-site-settings-bank-accounts"],
    queryFn: async () => {
      const data = await adminQuery("site_settings", "*", [{ op: "eq", column: "key", value: "bank_accounts" }]);
      if (data && data.length > 0) return data[0].value as BankDetails[];
      return null;
    },
    enabled: isPublic,
  });

  // Legacy single bank_details fallback
  const directLegacy = useSiteSettings("bank_details");
  const publicLegacy = useQuery({
    queryKey: ["public-site-settings-bank-details"],
    queryFn: async () => {
      const data = await adminQuery("site_settings", "*", [{ op: "eq", column: "key", value: "bank_details" }]);
      if (data && data.length > 0) return data[0].value as BankDetails;
      return null;
    },
    enabled: isPublic,
  });

  // ESPEES settings
  const directEspees = useSiteSettings("espees_settings");
  const publicEspees = useQuery({
    queryKey: ["public-site-settings-espees"],
    queryFn: async () => {
      const data = await adminQuery("site_settings", "*", [{ op: "eq", column: "key", value: "espees_settings" }]);
      if (data && data.length > 0) return data[0].value as { platform_url: string; instructions: string };
      return null;
    },
    enabled: isPublic,
  });

  const bankAccounts = isPublic ? publicBanks.data : directBanks.data;
  const legacyBank = isPublic ? publicLegacy.data : directLegacy.data;
  const espeesSettings = isPublic ? publicEspees.data : directEspees.data;
  const isLoading = isPublic
    ? publicBanks.isLoading || publicEspees.isLoading
    : directBanks.isLoading || directEspees.isLoading || directLegacy.isLoading;

  const [accounts, setAccounts] = useState<BankDetails[]>([]);
  const [espeesForm, setEspeesForm] = useState({ platform_url: "https://web.espees.org", instructions: "" });

  useEffect(() => {
    if (bankAccounts && Array.isArray(bankAccounts) && bankAccounts.length > 0) {
      setAccounts(bankAccounts as BankDetails[]);
    } else if (legacyBank && (legacyBank as BankDetails).bank_name) {
      setAccounts([legacyBank as BankDetails]);
    }
  }, [bankAccounts, legacyBank]);

  useEffect(() => {
    if (espeesSettings) setEspeesForm(espeesSettings as any);
  }, [espeesSettings]);

  const addAccount = () => {
    if (accounts.length >= 5) { toast.error("Maximum 5 bank accounts"); return; }
    setAccounts(prev => [...prev, { bank_name: "", account_number: "", account_name: "" }]);
  };

  const removeAccount = (idx: number) => {
    setAccounts(prev => prev.filter((_, i) => i !== idx));
  };

  const updateAccount = (idx: number, field: keyof BankDetails, value: string) => {
    setAccounts(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const handleSaveBanks = async () => {
    const valid = accounts.every(a => a.bank_name && a.account_number && a.account_name);
    if (!valid) { toast.error("All fields are required for each account"); return; }
    try {
      if (isPublic) {
        await adminUpsert("site_settings", { key: "bank_accounts", value: accounts }, "key");
        // Also update legacy key for backward compat
        await adminUpsert("site_settings", { key: "bank_details", value: accounts[0] }, "key");
      } else {
        await updateSetting.mutateAsync({ key: "bank_accounts", value: accounts });
        await updateSetting.mutateAsync({ key: "bank_details", value: accounts[0] });
      }
      toast.success("Bank accounts updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveEspees = async () => {
    try {
      if (isPublic) {
        await adminUpsert("site_settings", { key: "espees_settings", value: espeesForm }, "key");
      } else {
        await updateSetting.mutateAsync({ key: "espees_settings", value: espeesForm });
      }
      toast.success("ESPEES settings updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Banknote className="w-7 h-7 text-accent" /> Payment Settings
      </h1>

      <div className="space-y-8 max-w-2xl">
        {/* Bank Accounts */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-accent" /> Bank Transfer Accounts
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            These accounts are shown during checkout. You can add up to 5.
          </p>

          <div className="space-y-4">
            {accounts.map((acc, idx) => (
              <div key={idx} className="rounded-lg border border-border p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Account {idx + 1}</span>
                  {accounts.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeAccount(idx)} className="text-destructive h-7 px-2">
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><Label className="text-xs">Bank Name</Label><Input value={acc.bank_name} onChange={e => updateAccount(idx, "bank_name", e.target.value)} /></div>
                  <div><Label className="text-xs">Account Number</Label><Input value={acc.account_number} onChange={e => updateAccount(idx, "account_number", e.target.value)} /></div>
                  <div><Label className="text-xs">Account Name</Label><Input value={acc.account_name} onChange={e => updateAccount(idx, "account_name", e.target.value)} /></div>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <Button variant="outline" onClick={addAccount} disabled={accounts.length >= 5} className="gap-2">
                <Plus size={16} /> Add Account
              </Button>
              <Button onClick={handleSaveBanks} disabled={updateSetting.isPending} className="gap-2">
                <Save size={16} /> Save Accounts
              </Button>
            </div>
          </div>
        </div>

        {/* ESPEES Settings */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-accent" /> ESPEES Payment Settings
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Configure the ESPEES platform URL and payment instructions shown to users.
          </p>
          <div className="space-y-4">
            <div><Label>ESPEES Platform URL</Label><Input value={espeesForm.platform_url} onChange={e => setEspeesForm(prev => ({ ...prev, platform_url: e.target.value }))} /></div>
            <div><Label>Payment Instructions</Label><Input value={espeesForm.instructions} onChange={e => setEspeesForm(prev => ({ ...prev, instructions: e.target.value }))} placeholder="e.g. Send payment to account ISMNT" /></div>
            <Button onClick={handleSaveEspees} disabled={updateSetting.isPending} className="gap-2">
              <Save size={16} /> Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
