import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DUMMY_PASS = "prayer-network-user-2024!";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AuthModal = ({ open, onOpenChange, onSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<"user" | "admin">("user");
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [ministryName, setMinistryName] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setMode("user");
    setIsSignup(false);
    setEmail("");
    setFullName("");
    setMinistryName("");
    setDobDay("");
    setDobMonth("");
    setAdminEmail("");
    setAdminPassword("");
    setShowPassword(false);
  };

  const handleSuccess = () => {
    resetForm();
    onOpenChange(false);
    onSuccess?.();
  };

  const handleUserAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: DUMMY_PASS,
      });

      if (!signInError) {
        toast.success("Welcome back!");
        handleSuccess();
        return;
      }

      const { data: emailExists } = await supabase.rpc("check_email_exists", { lookup_email: email });

      if (emailExists) {
        setAdminEmail(email);
        setMode("admin");
        toast.info("This account uses a password. Please enter it below.");
        setSubmitting(false);
        return;
      }

      if (!isSignup) {
        setIsSignup(true);
        setSubmitting(false);
        return;
      }

      if (!fullName) {
        toast.error("Please enter your full name");
        setSubmitting(false);
        return;
      }

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

      if (signUpError) throw signUpError;

      toast.success("Welcome! You're now signed in.");
      handleSuccess();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });
      if (error) throw error;
      toast.success("Signed in!");
      handleSuccess();
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md p-6 gap-0 bg-card border-border">
        {mode === "user" ? (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full gold-gradient-bg flex items-center justify-center mx-auto mb-3">
                <Mail size={20} className="text-accent-foreground" />
              </div>
              <h2 className="text-xl font-serif font-bold text-foreground">
                {isSignup ? "Complete Your Profile" : "Sign In to Continue"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isSignup ? "Tell us a bit about yourself" : "Enter your email to get started"}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleUserAccess}>
              <div>
                <Label htmlFor="modal-email">Email</Label>
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="you@example.com"
                  className="mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {isSignup && (
                <>
                  <div>
                    <Label htmlFor="modal-fullName">Full Name</Label>
                    <Input
                      id="modal-fullName"
                      placeholder="Your full name"
                      className="mt-1"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="modal-ministryName">Ministry Name</Label>
                    <Input
                      id="modal-ministryName"
                      placeholder="Your ministry name"
                      className="mt-1"
                      value={ministryName}
                      onChange={(e) => setMinistryName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Birthday (Day)</Label>
                      <Select value={dobDay} onValueChange={setDobDay}>
                        <SelectTrigger className="mt-1">
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
                        <SelectTrigger className="mt-1">
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

              <Button
                type="submit"
                disabled={submitting}
                className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90"
              >
                {submitting ? "Please wait..." : isSignup ? "Create Account & Enter" : "Continue"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setMode("admin")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
              >
                <ShieldCheck size={12} /> Sign in as Admin
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full gold-gradient-bg flex items-center justify-center mx-auto mb-3">
                <Lock size={20} className="text-accent-foreground" />
              </div>
              <h2 className="text-xl font-serif font-bold text-foreground">Admin Login</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter your credentials</p>
            </div>

            <form className="space-y-4" onSubmit={handleAdminLogin}>
              <div>
                <Label htmlFor="modal-adminEmail">Email</Label>
                <Input
                  id="modal-adminEmail"
                  type="email"
                  placeholder="admin@example.com"
                  className="mt-1"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="modal-adminPassword">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="modal-adminPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90"
              >
                {submitting ? "Please wait..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setMode("user")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to user access
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
