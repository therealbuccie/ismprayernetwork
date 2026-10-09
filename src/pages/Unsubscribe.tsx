import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MailX, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

type State = "loading" | "valid" | "already" | "invalid" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) { setState("invalid"); return; }
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-unsubscribe-link?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setState("invalid"); return; }
        setEmail(data.email ?? null);
        setState(data.used || data.already_unsubscribed ? "already" : "valid");
      } catch {
        setState("error");
      }
    };
    validate();
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await supabase.functions.invoke("email-unsubscribe-link", { body: { token } });
    setSubmitting(false);
    setState(error ? "error" : "done");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto glass-card rounded-2xl border border-border/50 p-8 text-center">
          {state === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 animate-spin text-accent" size={36} />
              <p className="text-muted-foreground text-sm">Checking your link…</p>
            </>
          )}

          {state === "valid" && (
            <>
              <MailX className="mx-auto mb-4 text-accent" size={40} />
              <h1 className="text-2xl font-serif font-bold mb-2">Unsubscribe</h1>
              <p className="text-sm text-muted-foreground mb-6">
                {email ? <>Stop sending emails to <strong>{email}</strong>?</> : "Stop receiving emails from the ISM Prayer Network?"}
              </p>
              <Button onClick={confirm} disabled={submitting}>
                {submitting ? "Processing…" : "Confirm unsubscribe"}
              </Button>
            </>
          )}

          {state === "done" && (
            <>
              <CheckCircle2 className="mx-auto mb-4 text-accent" size={40} />
              <h1 className="text-2xl font-serif font-bold mb-2">You've been unsubscribed</h1>
              <p className="text-sm text-muted-foreground mb-6">
                You will no longer receive emails from the ISM Prayer Network at this address.
              </p>
              <Button asChild variant="outline"><Link to="/">Back to homepage</Link></Button>
            </>
          )}

          {state === "already" && (
            <>
              <CheckCircle2 className="mx-auto mb-4 text-accent" size={40} />
              <h1 className="text-2xl font-serif font-bold mb-2">Already unsubscribed</h1>
              <p className="text-sm text-muted-foreground mb-6">This address has already been removed from our mailing list.</p>
              <Button asChild variant="outline"><Link to="/">Back to homepage</Link></Button>
            </>
          )}

          {(state === "invalid" || state === "error") && (
            <>
              <AlertTriangle className="mx-auto mb-4 text-destructive" size={40} />
              <h1 className="text-2xl font-serif font-bold mb-2">Link not valid</h1>
              <p className="text-sm text-muted-foreground mb-6">
                This unsubscribe link is invalid or has expired. Please use the link in your most recent email, or contact us.
              </p>
              <Button asChild variant="outline"><Link to="/contact">Contact us</Link></Button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
