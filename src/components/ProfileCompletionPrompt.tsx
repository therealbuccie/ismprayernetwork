import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { COUNTRIES } from "@/lib/countries";
import { citiesForCountry, OTHER_CITY } from "@/lib/cities";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";

const TITLES = ["Pastor", "Reverend", "Evangelist", "Minister", "Apostle", "Prophet", "Bishop", "Deacon", "Deaconess", "Brother", "Sister"];
const ROLES = [
  "Senior Pastor", "Associate Pastor", "Church Founder", "Church Planter", "Church Worker",
  "Evangelist", "Missionary", "Youth Minister", "Worship Minister",
  "Cell / Home Group Leader", "Chaplain", "Ministry Partner", "Other",
];

const REMIND_KEY = "ism-profile-remind-until";
const SKIP_KEY = "ism-profile-skipped";

type ProfileRow = {
  id: string;
  full_name: string | null;
  ministry_name: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  title: string | null;
  ministerial_role: string | null;
};

const isIncomplete = (p: ProfileRow) =>
  !p.full_name?.trim() || !p.ministry_name?.trim() || !p.country?.trim() ||
  !p.phone?.trim() || !p.title?.trim() || !p.ministerial_role?.trim();

const ProfileCompletionPrompt = () => {
  const { user } = useAuth();
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [ministryName, setMinistryName] = useState("");
  const [ministerialRole, setMinisterialRole] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [citySelect, setCitySelect] = useState("");

  const cityOptions = useMemo(() => citiesForCountry(country), [country]);

  useEffect(() => {
    if (!user) { setOpen(false); return; }
    if (sessionStorage.getItem(SKIP_KEY) === "1") return;
    const until = Number(localStorage.getItem(REMIND_KEY) || 0);
    if (until && Date.now() < until) return;

    let active = true;
    supabase
      .from("profiles")
      .select("id, full_name, ministry_name, country, city, phone, title, ministerial_role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        const p = data as ProfileRow;
        if (!isIncomplete(p)) return;
        setRow(p);
        setFullName(p.full_name || "");
        setTitle(p.title || "");
        setPhone(p.phone || "");
        setMinistryName(p.ministry_name || "");
        setMinisterialRole(p.ministerial_role || "");
        setCountry(p.country || "");
        setCity(p.city || "");
        setCitySelect(p.city && citiesForCountry(p.country || "").includes(p.city) ? p.city : "");
        setOpen(true);
      });
    return () => { active = false; };
  }, [user]);

  const skipForNow = () => {
    sessionStorage.setItem(SKIP_KEY, "1");
    setOpen(false);
  };

  const remindLater = () => {
    localStorage.setItem(REMIND_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setOpen(false);
    toast.info("No problem — we'll remind you tomorrow.");
  };

  const save = async () => {
    if (!row) return;
    if (!fullName.trim() || !ministryName.trim() || !country) {
      toast.error("Name, ministry and country are required.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        title: title || null,
        phone: phone.trim() || null,
        ministry_name: ministryName.trim(),
        ministerial_role: ministerialRole || null,
        country,
        city: city.trim() || null,
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) { toast.error("Could not save your profile. Please try again."); return; }
    sessionStorage.setItem(SKIP_KEY, "1");
    localStorage.removeItem(REMIND_KEY);
    setOpen(false);
    toast.success("Thank you — your minister profile is complete.");
  };

  if (!user || !row) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) skipForNow(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <UserCheck size={18} className="text-accent" /> Complete your minister profile
          </DialogTitle>
          <DialogDescription>
            A few details help us connect you with the right prayer groups and programs in your region.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Select value={title} onValueChange={setTitle}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Title" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Full name *</Label>
              <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Ministry / Church *</Label>
              <Input className="mt-1" value={ministryName} onChange={(e) => setMinistryName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Ministerial role</Label>
              <Select value={ministerialRole} onValueChange={setMinisterialRole}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Country *</Label>
              <Select value={country} onValueChange={(v) => { setCountry(v); setCity(""); setCitySelect(""); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">City</Label>
              <Select
                value={citySelect}
                onValueChange={(v) => { setCitySelect(v); setCity(v === OTHER_CITY ? "" : v); }}
                disabled={!country}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder={country ? "Select your city" : "Select country first"} /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {cityOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value={OTHER_CITY}>Other (type manually)</SelectItem>
                </SelectContent>
              </Select>
              {citySelect === OTHER_CITY && (
                <Input className="mt-2" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter your city" />
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs">Phone / WhatsApp</Label>
            <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={save} disabled={saving} className="gold-gradient-bg text-accent-foreground hover:opacity-90 flex-1">
            {saving ? "Saving..." : "Save profile"}
          </Button>
          <Button variant="outline" onClick={remindLater} disabled={saving}>Remind me later</Button>
          <Button variant="ghost" onClick={skipForNow} disabled={saving}>Skip for now</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionPrompt;
