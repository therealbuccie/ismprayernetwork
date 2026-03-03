import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { storePin } from "@/hooks/useBookstoreAdmin";

export function BookstorePinGate({ onUnlock, title = "Bookstore Dashboard" }: { onUnlock: () => void; title?: string }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate PIN server-side via the dashboard-admin function
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error: fnError } = await supabase.functions.invoke("dashboard-admin", {
        body: { pin, action: "count", table: "books" },
      });
      if (fnError || data?.error) {
        setError(true);
        setPin("");
      } else {
        sessionStorage.setItem("bookstore_unlocked", "1");
        storePin(pin);
        onUnlock();
      }
    } catch {
      setError(true);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">Enter PIN to continue</p>
        <Input
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(false); }}
          className="text-center text-lg tracking-[0.5em]"
          autoFocus
        />
        {error && <p className="text-sm text-destructive">Incorrect PIN</p>}
        <Button type="submit" className="w-full" disabled={pin.length < 4 || loading}>{loading ? "Verifying…" : "Unlock"}</Button>
      </form>
    </div>
  );
}
