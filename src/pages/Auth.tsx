import Navbar from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DUMMY_PASS = "prayer-network-user-2024!";

const Auth = () => {
  const [mode, setMode] = useState<"user" | "admin">("user");
  const [isSignup, setIsSignup] = useState(false);

  // User fields
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [ministryName, setMinistryName] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");

  // Admin fields
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleUserAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      // Try sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: DUMMY_PASS,
      });

      if (!signInError) {
        toast.success("Welcome back!");
        navigate("/", { replace: true });
        return;
      }

      // Sign-in failed — if not in signup mode yet, show signup fields
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

      // Try to sign up
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
        // User already exists but wrong password — update password via re-signup
        if (signUpError.message?.includes("already") || signUpError.status === 422) {
          toast.error("This email is already registered. Please use admin login if you're an admin.");
        } else {
          throw signUpError;
        }
        return;
      }

      toast.success("Welcome! You're now signed in.");
      navigate("/", { replace: true });
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
      toast.success("Admin signed in!");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md px-4"
        >
          <GlassCard size="xl">
            {mode === "user" ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-full gold-gradient-bg flex items-center justify-center mx-auto mb-4">
                    <Mail size={24} className="text-accent-foreground" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold">
                    {isSignup ? "Complete Your Profile" : "Welcome"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isSignup ? "Tell us a bit about yourself" : "Enter your email to get started"}
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleUserAccess}>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
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
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          placeholder="Your full name"
                          className="mt-1"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="ministryName">Ministry Name</Label>
                        <Input
                          id="ministryName"
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

                <div className="mt-6 text-center">
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
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-full gold-gradient-bg flex items-center justify-center mx-auto mb-4">
                    <Lock size={24} className="text-accent-foreground" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold">Admin Login</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your admin credentials
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleAdminLogin}>
                  <div>
                    <Label htmlFor="adminEmail">Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@example.com"
                      className="mt-1"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminPassword">Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="adminPassword"
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

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setMode("user")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to user access
                  </button>
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
