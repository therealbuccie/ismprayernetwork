import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSiteSettings, BankDetails } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CartItem } from "@/hooks/useCart";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote, Upload, ExternalLink, Copy, CheckCircle, Loader2, ChevronDown, ChevronRight, MapPin, CreditCard, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  totalPrice: number;
  onSuccess: () => void;
}

type Currency = "usd" | "espees" | "ngn";

const currencyConfig: Record<Currency, { label: string; symbol: string; flag: string }> = {
  usd: { label: "USD ($)", symbol: "$", flag: "🇺🇸" },
  espees: { label: "ESPEES (E₱)", symbol: "E₱", flag: "💎" },
  ngn: { label: "NGN (₦)", symbol: "₦", flag: "🇳🇬" },
};

function getItemPrice(item: CartItem, currency: Currency): number {
  if (currency === "espees" && item.book.espees_price != null) return item.book.espees_price;
  if (currency === "ngn" && item.book.ngn_price != null) return item.book.ngn_price;
  return item.book.price;
}

function formatPrice(amount: number, currency: Currency): string {
  const { symbol } = currencyConfig[currency];
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcTotal(items: CartItem[], currency: Currency): number {
  return items.reduce((sum, i) => sum + getItemPrice(i, currency) * i.quantity, 0);
}

const CurrencySelector = ({ currency, onChange }: { currency: Currency; onChange: (c: Currency) => void }) => (
  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
    <span className="text-xs text-muted-foreground shrink-0">Currency:</span>
    <div className="flex gap-1 flex-1">
      {(Object.keys(currencyConfig) as Currency[]).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-all ${
            currency === c
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {currencyConfig[c].flag} {c.toUpperCase()}
        </button>
      ))}
    </div>
  </div>
);

const BankAccountCard = ({ account, copied, onCopy }: { account: BankDetails; copied: string | null; onCopy: (text: string, label: string) => void }) => {
  const [expanded, setExpanded] = useState(false);

  const fields: { label: string; value: string }[] = [
    { label: "Bank", value: account.bank_name },
    { label: "Account Name", value: account.account_name },
    { label: "Account No.", value: account.account_number },
  ];

  if (account.currency) fields.push({ label: "Currency", value: account.currency });
  if (account.sort_code) fields.push({ label: "Sort Code", value: account.sort_code });
  if (account.iban) fields.push({ label: "IBAN", value: account.iban });
  if (account.bic) fields.push({ label: "BIC", value: account.bic });
  if (account.swift_code) fields.push({ label: "SWIFT", value: account.swift_code });
  if (account.routing_number) fields.push({ label: "Routing No.", value: account.routing_number });
  if (account.ifsc) fields.push({ label: "IFSC", value: account.ifsc });
  if (account.branch_code) fields.push({ label: "Branch Code", value: account.branch_code });
  if (account.reference) fields.push({ label: "Reference", value: account.reference });
  if (account.bank_address) fields.push({ label: "Bank Address", value: account.bank_address });
  if (account.address) fields.push({ label: "Address", value: account.address });

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left p-3 hover:bg-muted/40 transition-colors"
      >
        <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
        <span className="text-xs font-semibold text-foreground flex-1">
          {account.region || account.bank_name}
        </span>
        <span className="text-[10px] text-muted-foreground mr-1">{account.bank_name}</span>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1 border-t border-border/40">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-xs py-0.5">
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground">{label}: </span>
                <span className="font-medium text-foreground break-all">{value}</span>
              </div>
              <button onClick={() => onCopy(value, `${account.region}-${label}`)} className="p-1 rounded hover:bg-muted transition-colors shrink-0 ml-1">
                {copied === `${account.region}-${label}` ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function CheckoutModal({ open, onClose, items, totalPrice, onSuccess }: CheckoutModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: bankAccounts } = useSiteSettings("bank_accounts") as { data: BankDetails[] | undefined };

  const [currency, setCurrency] = useState<Currency>("usd");
  const [method, setMethod] = useState<"bank_transfer" | "espees" | "kingspay" | "online_pay" | null>(null);
  const [popFile, setPopFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const displayTotal = calcTotal(items, currency);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const selectMethod = (m: "bank_transfer" | "espees" | "kingspay" | "online_pay") => {
    setMethod(m);
    if (m === "espees") setCurrency("espees");
    else if (m === "kingspay") setCurrency("usd");
    else if (m === "bank_transfer") setCurrency("usd");
    else if (m === "online_pay") setCurrency("usd");
  };

  const handleSubmitOrder = async (paymentMethod: "bank_transfer" | "espees" | "kingspay" | "online_pay") => {
    if (!user) { toast.error("Please log in first"); navigate("/auth"); return; }
    if (!popFile) { toast.error("Please upload your proof of payment"); return; }

    setSubmitting(true);
    try {
      const ext = popFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("pop-uploads").upload(path, popFile);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("pop-uploads").getPublicUrl(path);

      const orderItems = items.map(i => ({
        book_id: i.book.id,
        title: i.book.title,
        format: i.format,
        quantity: i.quantity,
        price: getItemPrice(i, currency),
        currency: currency,
      }));

      const { error } = await supabase.from("purchase_orders").insert({
        user_id: user.id,
        items: orderItems,
        total_amount: displayTotal,
        payment_method: paymentMethod,
        espees_code: paymentMethod === "espees" ? "CEISM2" : paymentMethod === "kingspay" ? "ISMNT/ISMOP" : null,
        pop_image_url: publicUrl,
      });
      if (error) throw error;

      toast.success("Order submitted! Awaiting admin approval.");
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetMethod = () => { setMethod(null); setPopFile(null); setCurrency("usd"); };

  const hasMissingPrices = items.some(i => {
    if (currency === "espees") return i.book.espees_price == null;
    if (currency === "ngn") return i.book.ngn_price == null;
    return false;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); resetMethod(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout — {formatPrice(displayTotal, currency)}</DialogTitle>
        </DialogHeader>

        {/* Currency selector */}
        <CurrencySelector currency={currency} onChange={setCurrency} />

        {hasMissingPrices && (
          <p className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-2">
            ⚠️ Some items don't have a {currency.toUpperCase()} price set — USD price is shown for those.
          </p>
        )}

        {/* Order summary */}
        <div className="space-y-2 border-b border-border pb-4">
          {items.map(item => (
            <div key={`${item.book.id}-${item.format}`} className="flex justify-between text-sm">
              <span className="text-foreground">{item.book.title} <Badge variant="outline" className="text-[10px] ml-1 capitalize">{item.format}</Badge> × {item.quantity}</span>
              <span className="text-muted-foreground">{formatPrice(getItemPrice(item, currency) * item.quantity, currency)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2">
            <span>Total</span>
            <span className="gold-gradient">{formatPrice(displayTotal, currency)}</span>
          </div>
        </div>

        {/* Payment method selection */}
        {!method ? (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">Choose a payment method:</p>
            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4" onClick={() => selectMethod("bank_transfer")}>
              <Banknote className="w-5 h-5 text-accent" />
              <div className="text-left">
                <p className="font-semibold">Bank Transfer</p>
                <p className="text-xs text-muted-foreground">Transfer & upload proof of payment</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4" onClick={() => selectMethod("espees")}>
              <ExternalLink className="w-5 h-5 text-accent" />
              <div className="text-left">
                <p className="font-semibold">Pay with ESPEES</p>
                <p className="text-xs text-muted-foreground">Merchant Code: CEISM2</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4" onClick={() => selectMethod("kingspay")}>
              <CreditCard className="w-5 h-5 text-accent" />
              <div className="text-left">
                <p className="font-semibold">Pay with Kingspay</p>
                <p className="text-xs text-muted-foreground">ISMNT (Foreign) / ISMOP (Naira)</p>
              </div>
            </Button>
          </div>
        ) : method === "bank_transfer" ? (
          <div className="space-y-4 pt-2">
            <Button variant="ghost" size="sm" onClick={resetMethod} className="text-xs text-muted-foreground">
              ← Change payment method
            </Button>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Banknote className="w-4 h-4 text-accent" /> Select Your Region & Transfer
              </h3>
              <p className="text-xs text-muted-foreground">
                Choose the bank account closest to your location. Click on any account to see full details.
              </p>

              <div className="space-y-2">
                {bankAccounts && bankAccounts.length > 0 ? (
                  bankAccounts.map((acc, idx) => (
                    <BankAccountCard key={idx} account={acc} copied={copied} onCopy={copyText} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Loading bank details...</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Transfer <span className="font-bold text-foreground">{formatPrice(displayTotal, currency)}</span> and upload your proof of payment below.
              </p>
            </div>

            <div>
              <Label>Upload Proof of Payment *</Label>
              <Input type="file" accept="image/*,.pdf" onChange={e => setPopFile(e.target.files?.[0] || null)} className="mt-1" />
              {popFile && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" /> {popFile.name}
                </p>
              )}
            </div>

            <Button onClick={() => handleSubmitOrder("bank_transfer")} disabled={submitting || !popFile} className="w-full gold-gradient-bg text-accent-foreground">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : <><Upload className="w-4 h-4 mr-2" /> Submit Order</>}
            </Button>
          </div>
        ) : method === "espees" ? (
          <div className="space-y-4 pt-2">
            <Button variant="ghost" size="sm" onClick={resetMethod} className="text-xs text-muted-foreground">
              ← Change payment method
            </Button>

            <div className="glass-card rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-accent" /> Pay with ESPEES
              </h3>
              <p className="text-sm text-muted-foreground">
                1. Click the button below to open ESPEES and complete your payment.<br/>
                2. After paying, upload your proof of payment below.
              </p>
              <div className="flex items-center justify-between bg-muted/50 rounded-md p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Merchant Code</p>
                  <p className="text-lg font-bold text-foreground">CEISM2</p>
                </div>
                <button onClick={() => copyText("CEISM2", "espees")} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                  {copied === "espees" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Amount: <span className="font-bold text-foreground">{formatPrice(displayTotal, currency)}</span>
              </p>
              <Button variant="outline" className="w-full gap-2" onClick={() => window.open("https://web.espees.org", "_blank")}>
                <ExternalLink className="w-4 h-4" /> Open ESPEES Platform
              </Button>
            </div>

            <div>
              <Label>Upload Proof of Payment *</Label>
              <Input type="file" accept="image/*,.pdf" onChange={e => setPopFile(e.target.files?.[0] || null)} className="mt-1" />
              {popFile && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" /> {popFile.name}
                </p>
              )}
            </div>

            <Button onClick={() => handleSubmitOrder("espees")} disabled={submitting || !popFile} className="w-full gold-gradient-bg text-accent-foreground">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : <><Upload className="w-4 h-4 mr-2" /> Submit Order</>}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <Button variant="ghost" size="sm" onClick={resetMethod} className="text-xs text-muted-foreground">
              ← Change payment method
            </Button>

            <div className="glass-card rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-accent" /> Pay with Kingspay
              </h3>
              <p className="text-sm text-muted-foreground">
                1. Open Kingspay and send payment using the appropriate code below.<br/>
                2. After paying, upload your proof of payment.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-muted/50 rounded-md p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Foreign Currency</p>
                    <p className="text-lg font-bold text-foreground">ISMNT</p>
                  </div>
                  <button onClick={() => copyText("ISMNT", "kingspay-foreign")} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                    {copied === "kingspay-foreign" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-muted/50 rounded-md p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Naira (₦)</p>
                    <p className="text-lg font-bold text-foreground">ISMOP</p>
                  </div>
                  <button onClick={() => copyText("ISMOP", "kingspay-naira")} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                    {copied === "kingspay-naira" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Amount: <span className="font-bold text-foreground">{formatPrice(displayTotal, currency)}</span>
              </p>
            </div>

            <div>
              <Label>Upload Proof of Payment *</Label>
              <Input type="file" accept="image/*,.pdf" onChange={e => setPopFile(e.target.files?.[0] || null)} className="mt-1" />
              {popFile && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" /> {popFile.name}
                </p>
              )}
            </div>

            <Button onClick={() => handleSubmitOrder("kingspay")} disabled={submitting || !popFile} className="w-full gold-gradient-bg text-accent-foreground">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : <><Upload className="w-4 h-4 mr-2" /> Submit Order</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
