import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock } from "lucide-react";

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

type Step = "email" | "signup" | "password";

export function BookstoreAuthModal({ open, onClose, onSuccess }: BookstoreAuthModalProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [ministryName, setMinistryName] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep("email");
    setEmail("");
    setFullName("");
    setMinistryName("");
    setDobDay("");
    setDobMonth("");
    setPassword("");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      // Try sign in with dummy password (regular users)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: DUMMY_PASS,
      });

      if (!error) {
        toast({ title: "Welcome back!" });
        onSuccess();
        onClose();
        reset();
        return;
      }

      // Dummy password failed — check if email exists in database
      const { data: emailExists } = await supabase.rpc("check_email_exists", { lookup_email: email });

      if (emailExists) {
        // Email exists with custom password — show password field
        setStep("password");
        setLoading(false);
        return;
      }

      // Email not in database — create new account with dummy pass, then collect details
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: DUMMY_PASS,
        options: { data: { full_name: "" } },
      });

      if (signUpError) throw signUpError;

      // Sign them out and show signup form to collect proper details
      await supabase.auth.signOut();
      setStep("signup");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ title: "Please enter your full name", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      // Update the user metadata and sign in (user was already created with dummy pass)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: DUMMY_PASS,
      });

      if (error) throw error;

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          ministry_name: ministryName,
          dob_day: dobDay ? parseInt(dobDay) : null,
          dob_month: dobMonth ? parseInt(dobMonth) : null,
        },
      });

      // Update profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          full_name: fullName,
          ministry_name: ministryName,
          dob_day: dobDay ? parseInt(dobDay) : null,
          dob_month: dobMonth ? parseInt(dobMonth) : null,
        }).eq("user_id", user.id);
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Welcome back!" });
      onSuccess();
      onClose();
      reset();
    } catch (err: any) {
      toast({ title: "Invalid password", description: err.message, variant: "destructive" });
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
              {step === "password" ? <Lock className="w-5 h-5 text-accent-foreground" /> : <Mail className="w-5 h-5 text-accent-foreground" />}
            </div>
            <div>
              <DialogTitle>
                {step === "email" && "Sign in to continue"}
                {step === "signup" && "Complete Your Profile"}
                {step === "password" && "Enter Your Password"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {step === "email" && "Enter your email to add items to your cart."}
          {step === "signup" && "Just a few details to create your account."}
          {step === "password" && "This account uses a password. Please enter it to continue."}
        </p>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4 pt-2">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <Button type="submit" className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Continue
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4 pt-2">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} disabled />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <button type="button" className="text-accent underline" onClick={() => { setStep("email"); setPassword(""); }}>
                ← Use a different email
              </button>
            </p>
          </form>
        )}

        {step === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4 pt-2">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} disabled />
            </div>
            <div>
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
            </div>
            <div>
              <Label>Ministry Name</Label>
              <Input value={ministryName} onChange={(e) => setMinistryName(e.target.value)} placeholder="Your ministry name (optional)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Birthday (Day)</Label>
                <Select value={dobDay} onValueChange={setDobDay}>
                  <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Birthday (Month)</Label>
                <Select value={dobMonth} onValueChange={setDobMonth}>
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Account & Continue
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <button type="button" className="text-accent underline" onClick={() => { setStep("email"); }}>
                ← Use a different email
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
