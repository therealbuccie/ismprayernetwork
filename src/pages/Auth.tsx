import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      toast.success("You're signed in!");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Signed in successfully!");
        navigate("/");
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast.success("Account created! Please check your email to verify.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
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
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full gold-gradient-bg flex items-center justify-center mx-auto mb-4">
                <Lock size={24} className="text-accent-foreground" />
              </div>
              <h1 className="text-2xl font-serif font-bold">
                {isLogin ? "Welcome Back" : "Join the Network"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin ? "Sign in to continue" : "Create your account"}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Your full name" className="mt-1" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" className="mt-1" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
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
              <Button type="submit" disabled={submitting} className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90">
                {submitting ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-accent font-medium hover:underline"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
