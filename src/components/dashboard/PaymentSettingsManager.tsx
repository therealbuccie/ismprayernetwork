import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSetting, BankDetails } from "@/hooks/useSiteSettings";
import { isPublicDashboard, adminQuery, adminUpsert } from "@/hooks/useBookstoreAdmin";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Banknote, Plus, Trash2, Wallet, ChevronDown, ChevronRight, MapPin } from "lucide-react";

const OPTIONAL_FIELDS: { key: keyof BankDetails; label: string }[] = [
  { key: "region", label: "Region" },
  { key: "bank_address", label: "Bank Address" },
  { key: "currency", label: "Currency" },
  { key: "sort_code", label: "Sort Code" },
  { key: "iban", label: "IBAN" },
  { key: "bic", label: "BIC" },
  { key: "swift_code", label: "SWIFT Code" },
  { key: "routing_number", label: "Routing No." },
  { key: "ifsc", label: "IFSC" },
  { key: "branch_code", label: "Branch Code" },
  { key: "reference", label: "Reference" },
  { key: "address", label: "Address" },
];

export function PaymentSettingsManager() {
  const isPublic = isPublicDashboard();
  const updateSetting = useUpdateSiteSetting();

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
  const espeesSettings = isPublic ? publicEspees.data : directEspees.data;
  const isLoading = isPublic ? publicBanks.isLoading || publicEspees.isLoading : directBanks.isLoading || directEspees.isLoading;

  const [accounts, setAccounts] = useState<BankDetails[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [espeesForm, setEspeesForm] = useState({ platform_url: "https://web.espees.org", instructions: "" });

  useEffect(() => {
    if (bankAccounts && Array.isArray(bankAccounts) && bankAccounts.length > 0) {
      setAccounts(bankAccounts as BankDetails[]);
    }
  }, [bankAccounts]);

  useEffect(() => {
    if (espeesSettings) setEspeesForm(espeesSettings as any);
  }, [espeesSettings]);

  const addAccount = () => {
    if (accounts.length >= 10) { toast.error("Maximum 10 bank accounts"); return; }
    setAccounts(prev => [...prev, { bank_name: "", account_number: "", account_name: "", region: "" }]);
    setExpandedIdx(accounts.length);
  };

  const removeAccount = (idx: number) => {
    setAccounts(prev => prev.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  const updateAccount = (idx: number, field: keyof BankDetails, value: string) => {
    setAccounts(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const handleSaveBanks = async () => {
    const valid = accounts.every(a => a.bank_name && a.account_number && a.account_name);
    if (!valid) { toast.error("Bank Name, Account Number, and Account Name are required for each account"); return; }
    try {
      if (isPublic) {
        await adminUpsert("site_settings", { key: "bank_accounts", value: accounts }, "key");
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

      <div className="space-y-8 max-w-3xl">
        {/* Bank Accounts */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-accent" /> Bank Transfer Accounts
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Regional bank accounts shown during checkout. Users select the one closest to their location.
          </p>

          <div className="space-y-3">
            {accounts.map((acc, idx) => {
              const isOpen = expandedIdx === idx;
              return (
                <div key={idx} className="rounded-lg border border-border p-3 space-y-2">
                  <button
                    onClick={() => setExpandedIdx(isOpen ? null : idx)}
                    className="w-full flex items-center gap-2 text-left"
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    <span className="text-sm font-semibold text-foreground flex-1">
                      {acc.region || acc.bank_name || `Account ${idx + 1}`}
                    </span>
                    <span className="text-xs text-muted-foreground">{acc.bank_name}</span>
                  </button>

                  {isOpen && (
                    <div className="space-y-3 pt-2 border-t border-border/50">
                      {/* Required fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div><Label className="text-xs">Bank Name *</Label><Input value={acc.bank_name} onChange={e => updateAccount(idx, "bank_name", e.target.value)} /></div>
                        <div><Label className="text-xs">Account Number *</Label><Input value={acc.account_number} onChange={e => updateAccount(idx, "account_number", e.target.value)} /></div>
                        <div><Label className="text-xs">Account Name *</Label><Input value={acc.account_name} onChange={e => updateAccount(idx, "account_name", e.target.value)} /></div>
                      </div>

                      {/* Optional fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {OPTIONAL_FIELDS.map(({ key, label }) => (
                          <div key={key}>
                            <Label className="text-xs">{label}</Label>
                            <Input
                              value={(acc[key] as string) || ""}
                              onChange={e => updateAccount(idx, key, e.target.value)}
                              placeholder={`Optional`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => removeAccount(idx)} className="text-destructive h-7 px-2 gap-1">
                          <Trash2 size={14} /> Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex gap-2">
              <Button variant="outline" onClick={addAccount} disabled={accounts.length >= 10} className="gap-2">
                <Plus size={16} /> Add Account
              </Button>
              <Button onClick={handleSaveBanks} disabled={updateSetting.isPending} className="gap-2">
                <Save size={16} /> Save All Accounts
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
