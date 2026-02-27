import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

const DUMMY_PASS = "prayer-network-user-2024!";
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface BookstoreAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookstoreAuthModal({ open, onClose, onSuccess }: BookstoreAuthModalProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [ministryName, setMinistryName] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setIsSignup(false);
    setEmail("");
    setFullName("");
    setMinistryName("");
    setDobDay("");
    setDobMonth("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      // Try sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: DUMMY_PASS,
      });

      if (!signInError) {
        toast({ title: "Welcome back!" });
        onSuccess();
        onClose();
        reset();
        return;
      }

      // Sign-in failed — show signup fields if not already showing
      if (!isSignup) {
        setIsSignup(true);
        setLoading(false);
        return;
      }

      // Validate signup fields
      if (!fullName.trim()) {
        toast({ title: "Please enter your full name", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Sign up
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: DUMMY_PASS,
        options: {
          data: {
            full_name: fullName,
            ministry_name: ministryName,
            dob_day: dobDay ? parseInt(dobDay) : null,
            dob_month: dobMonth ? parseInt(dobMonth) : null,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message?.includes("already") || signUpError.status === 422) {
          toast({ title: "This email is already registered", variant: "destructive" });
        } else {
          throw signUpError;
        }
        return;
      }

      toast({ title: "Welcome! You're now signed in." });
      onSuccess();
      onClose();
      reset();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gold-gradient-bg flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <DialogTitle>{isSignup ? "Complete Your Profile" : "Sign in to continue"}</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {isSignup
            ? "Just a few details to create your account."
            : "Enter your email to add items to your cart."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isSignup}
            />
          </div>

          {isSignup && (
            <>
              <div>
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <Label>Ministry Name</Label>
                <Input
                  value={ministryName}
                  onChange={(e) => setMinistryName(e.target.value)}
                  placeholder="Your ministry name (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Birthday (Day)</Label>
                  <Select value={dobDay} onValueChange={setDobDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Birthday (Month)</Label>
                  <Select value={dobMonth} onValueChange={setDobMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSignup ? "Create Account & Continue" : "Continue"}
          </Button>

          {isSignup && (
            <p className="text-center text-xs text-muted-foreground">
              <button type="button" className="text-accent underline" onClick={() => setIsSignup(false)}>
                ← Use a different email
              </button>
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
