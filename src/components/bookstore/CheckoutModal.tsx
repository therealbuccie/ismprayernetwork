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
import { Banknote, Upload, ExternalLink, Copy, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  totalPrice: number;
  onSuccess: () => void;
}

export function CheckoutModal({ open, onClose, items, totalPrice, onSuccess }: CheckoutModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: bankDetails } = useSiteSettings("bank_details") as { data: BankDetails | undefined };

  const [method, setMethod] = useState<"bank_transfer" | "espees" | null>(null);
  const [popFile, setPopFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleBankSubmit = async () => {
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
        price: i.book.price,
      }));

      const { error } = await supabase.from("purchase_orders").insert({
        user_id: user.id,
        items: orderItems,
        total_amount: totalPrice,
        payment_method: "bank_transfer",
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

  const handleEspeesSubmit = async () => {
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
        price: i.book.price,
      }));

      const { error } = await supabase.from("purchase_orders").insert({
        user_id: user.id,
        items: orderItems,
        total_amount: totalPrice,
        payment_method: "espees",
        espees_code: "ISMNT",
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

  const resetMethod = () => {
    setMethod(null);
    setPopFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); resetMethod(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout — ${totalPrice.toFixed(2)}</DialogTitle>
        </DialogHeader>

        {/* Order summary */}
        <div className="space-y-2 border-b border-border pb-4">
          {items.map(item => (
            <div key={`${item.book.id}-${item.format}`} className="flex justify-between text-sm">
              <span className="text-foreground">{item.book.title} <Badge variant="outline" className="text-[10px] ml-1 capitalize">{item.format}</Badge> × {item.quantity}</span>
              <span className="text-muted-foreground">${(item.book.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2">
            <span>Total</span>
            <span className="gold-gradient">${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method selection */}
        {!method ? (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">Choose a payment method:</p>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4"
              onClick={() => setMethod("bank_transfer")}
            >
              <Banknote className="w-5 h-5 text-accent" />
              <div className="text-left">
                <p className="font-semibold">Bank Transfer</p>
                <p className="text-xs text-muted-foreground">Transfer & upload proof of payment</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4"
              onClick={() => setMethod("espees")}
            >
              <ExternalLink className="w-5 h-5 text-accent" />
              <div className="text-left">
                <p className="font-semibold">Pay with ESPEES</p>
                <p className="text-xs text-muted-foreground">Use ESPEES code: ISMNT</p>
              </div>
            </Button>
          </div>
        ) : method === "bank_transfer" ? (
          <div className="space-y-4 pt-2">
            <Button variant="ghost" size="sm" onClick={resetMethod} className="text-xs text-muted-foreground">
              ← Change payment method
            </Button>

            {/* Bank details */}
            <div className="glass-card rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Banknote className="w-4 h-4 text-accent" /> Bank Transfer Details
              </h3>
              {bankDetails ? (
                <>
                  {[
                    { label: "Bank Name", value: bankDetails.bank_name },
                    { label: "Account Number", value: bankDetails.account_number },
                    { label: "Account Name", value: bankDetails.account_name },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium text-foreground">{value}</p>
                      </div>
                      <button
                        onClick={() => copyText(value, label)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      >
                        {copied === label ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    Transfer <span className="font-bold text-foreground">${totalPrice.toFixed(2)}</span> and upload your proof of payment below.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading bank details...</p>
              )}
            </div>

            {/* POP upload */}
            <div>
              <Label>Upload Proof of Payment *</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={e => setPopFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              {popFile && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" /> {popFile.name}
                </p>
              )}
            </div>

            <Button
              onClick={handleBankSubmit}
              disabled={submitting || !popFile}
              className="w-full gold-gradient-bg text-accent-foreground"
            >
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
                <ExternalLink className="w-4 h-4 text-accent" /> Pay with ESPEES
              </h3>
              <p className="text-sm text-muted-foreground">
                1. Click the button below to open ESPEES and complete your payment.<br/>
                2. After paying, upload your proof of payment below.
              </p>
              <div className="flex items-center justify-between bg-muted/50 rounded-md p-3">
                <div>
                  <p className="text-xs text-muted-foreground">ESPEES Code</p>
                  <p className="text-lg font-bold text-foreground">ISMNT</p>
                </div>
                <button
                  onClick={() => copyText("ISMNT", "espees")}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  {copied === "espees" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Amount: <span className="font-bold text-foreground">${totalPrice.toFixed(2)}</span>
              </p>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open("https://web.espees.org", "_blank")}
              >
                <ExternalLink className="w-4 h-4" /> Open ESPEES Platform
              </Button>
            </div>

            {/* POP upload for ESPEES */}
            <div>
              <Label>Upload Proof of Payment *</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={e => setPopFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              {popFile && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" /> {popFile.name}
                </p>
              )}
            </div>

            <Button
              onClick={handleEspeesSubmit}
              disabled={submitting || !popFile}
              className="w-full gold-gradient-bg text-accent-foreground"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : <><Upload className="w-4 h-4 mr-2" /> Submit Order</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
