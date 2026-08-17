import Navbar from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/countries";
import { citiesForCountry, OTHER_CITY } from "@/lib/cities";
import { HeartHandshake, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TITLES = ["Pastor", "Reverend", "Evangelist", "Minister", "Apostle", "Prophet", "Bishop", "Deacon", "Deaconess", "Brother", "Sister"];

const ROLES = [
  "Senior Pastor",
  "Associate Pastor",
  "Church Founder",
  "Church Planter",
  "Church Worker",
  "Evangelist",
  "Missionary",
  "Youth Minister",
  "Worship Minister",
  "Cell / Home Group Leader",
  "Chaplain",
  "Ministry Partner",
  "Other",
];

const DUMMY_PASS = "prayer-network-user-2024!";

const schema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  ministryName: z.string().trim().min(2, "Please enter your ministry or church name").max(150),
  country: z.string().trim().min(1, "Please select your country"),
  title: z.string().trim().max(50).optional(),
  ministerialRole: z.string().trim().max(80).optional(),
  city: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
});

const Join = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ministryName, setMinistryName] = useState("");
  const [ministerialRole, setMinisterialRole] = useState("");
  const [city, setCity] = useState("");
  const [citySelect, setCitySelect] = useState("");
  const [country, setCountry] = useState("");
  const cityOptions = citiesForCountry(country);
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user && !done) navigate("/groups", { replace: true });
  }, [user, done, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, email, ministryName, country, title, ministerialRole, city, phone });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data: exists } = await supabase.rpc("check_email_exists", { lookup_email: cleanEmail });
      if (exists) {
        toast.info("You're already registered — signing you in.");
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: DUMMY_PASS });
        if (error) {
          navigate("/auth");
          return;
        }
        navigate("/groups", { replace: true });
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: DUMMY_PASS,
        options: {
          data: {
            full_name: fullName.trim(),
            ministry_name: ministryName.trim(),
            country,
            city: city.trim() || null,
            phone: phone.trim() || null,
            title: title || null,
            ministerial_role: ministerialRole || null,
            dob_day: dobDay ? parseInt(dobDay) : null,
            dob_month: dobMonth ? parseInt(dobMonth) : null,
          },
        },
      });
      if (signUpError) throw signUpError;

      if (notes.trim()) {
        await supabase.from("contact_messages").insert({
          name: `${title ? title + " " : ""}${fullName.trim()}`,
          email: cleanEmail,
          message: `New minister registration note: ${notes.trim()}`,
        });
      }

      setDone(true);
      toast.success("Welcome to the ISM Ministers' Prayer Network!");
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full gold-gradient-bg flex items-center justify-center mx-auto mb-4">
                <HeartHandshake size={24} className="text-accent-foreground" />
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold">Join the Prayer Network</h1>
              <p className="text-muted-foreground mt-2">
                Registration for ministers of the gospel. Tell us about you and your ministry.
              </p>
            </div>

            <GlassCard size="xl">
              {done ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={44} className="mx-auto mb-4 text-accent" />
                  <h2 className="text-2xl font-serif font-bold mb-2">You're in, {fullName.split(" ")[0]}!</h2>
                  <p className="text-muted-foreground mb-6">
                    Your minister profile has been created and a welcome email is on its way.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => navigate("/groups")} className="gold-gradient-bg text-accent-foreground hover:opacity-90">
                      Join a Prayer Group
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/prayer-points")}>
                      View Prayer Points
                    </Button>
                  </div>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Select value={title} onValueChange={setTitle}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Title" /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          {TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input id="fullName" className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone / WhatsApp</Label>
                      <Input id="phone" className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ministryName">Ministry / Church Name *</Label>
                      <Input id="ministryName" className="mt-1" value={ministryName} onChange={(e) => setMinistryName(e.target.value)} placeholder="Your ministry or church" required />
                    </div>
                    <div>
                      <Label>Ministerial Role</Label>
                      <Select value={ministerialRole} onValueChange={setMinisterialRole}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>City</Label>
                      {cityOptions.length > 0 ? (
                        <>
                          <Select
                            value={citySelect}
                            onValueChange={(v) => {
                              setCitySelect(v);
                              setCity(v === OTHER_CITY ? "" : v);
                            }}
                            disabled={!country}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder={country ? "Select your city" : "Select a country first"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {cityOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              <SelectItem value={OTHER_CITY}>Other (type manually)</SelectItem>
                            </SelectContent>
                          </Select>
                          {citySelect === OTHER_CITY && (
                            <Input className="mt-2" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter your city" />
                          )}
                        </>
                      ) : (
                        <Input id="city" className="mt-1" value={city} onChange={(e) => setCity(e.target.value)} placeholder={country ? "Your city" : "Select a country first"} disabled={!country} />
                      )}
                    </div>
                    <div>
                      <Label>Country *</Label>
                      <Select
                        value={country}
                        onValueChange={(v) => {
                          setCountry(v);
                          setCity("");
                          setCitySelect("");
                        }}
                      >
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select your country" /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Birthday (Day)</Label>
                      <Select value={dobDay} onValueChange={setDobDay}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Day" /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Birthday (Month)</Label>
                      <Select value={dobMonth} onValueChange={setDobMonth}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          {MONTHS.map((m, i) => (
                            <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Anything else we should know?</Label>
                    <Textarea
                      id="notes"
                      className="mt-1"
                      rows={3}
                      maxLength={1000}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Prayer focus, region of ministry, how you heard about us..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90"
                  >
                    {submitting ? "Registering..." : "Join the Prayer Network"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Already registered?{" "}
                    <button type="button" onClick={() => navigate("/auth")} className="underline hover:text-foreground">
                      Sign in here
                    </button>
                  </p>
                </form>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Join;
