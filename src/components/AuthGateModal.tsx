import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DUMMY_PASS = "prayer-network-user-2024!";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

const AuthGateModal = ({ open, onOpenChange, title = "Sign In to Continue", description = "Enter your email to access this feature" }: AuthGateModalProps) => {
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
        onOpenChange(false);
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
      onOpenChange(false);
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
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {mode === "user" ? (
          <>
            <DialogHeader>
              <div className="w-12 h-12 rounded-full gold-gradient-bg flex items-center justify-center mx-auto mb-2">
                <Mail size={20} className="text-accent-foreground" />
              </div>
              <DialogTitle className="text-center">
                {isSignup ? "Complete Your Profile" : title}
              </DialogTitle>
              <DialogDescription className="text-center">
                {isSignup ? "Tell us a bit about yourself" : description}
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleUserAccess}>
              <div>
                <Label htmlFor="gate-email">Email</Label>
                <Input
                  id="gate-email"
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
                    <Label htmlFor="gate-fullName">Full Name</Label>
                    <Input
                      id="gate-fullName"
                      placeholder="Your full name"
                      className="mt-1"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gate-ministryName">Ministry Name</Label>
                    <Input
                      id="gate-ministryName"
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

            <div className="text-center">
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
            <DialogHeader>
              <div className="w-12 h-12 rounded-full gold-gradient-bg flex items-center justify-center mx-auto mb-2">
                <Lock size={20} className="text-accent-foreground" />
              </div>
              <DialogTitle className="text-center">Admin Login</DialogTitle>
              <DialogDescription className="text-center">
                Enter your admin credentials
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleAdminLogin}>
              <div>
                <Label htmlFor="gate-adminEmail">Email</Label>
                <Input
                  id="gate-adminEmail"
                  type="email"
                  placeholder="admin@example.com"
                  className="mt-1"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gate-adminPassword">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="gate-adminPassword"
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

            <div className="text-center">
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

export default AuthGateModal;
