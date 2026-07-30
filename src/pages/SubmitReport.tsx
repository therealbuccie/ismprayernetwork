import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ClipboardList, Upload, FileText, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const emptyForm = {
  minister_name: "",
  church: "",
  prayer_date: "",
  attendance: "",
  notes: "",
};

const SubmitReport = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: myReports = [] } = useQuery({
    queryKey: ["my-prayer-reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to send a report");
      navigate("/auth");
      return;
    }
    if (!form.minister_name.trim() || !form.church.trim() || !form.prayer_date) {
      toast.error("Minister name, church and prayer date are required");
      return;
    }
    const attendance = parseInt(form.attendance) || 0;
    if (attendance < 0 || attendance > 10_000_000) {
      toast.error("Enter a valid attendance number");
      return;
    }

    setSubmitting(true);
    try {
      let file_url: string | null = null;
      let file_name: string | null = null;

      if (file) {
        if (file.size > 15 * 1024 * 1024) throw new Error("File must be under 15MB");
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "dat";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("report-uploads").upload(path, file);
        if (upErr) throw upErr;
        file_url = path;
        file_name = file.name.slice(0, 180);
      }

      const { error } = await supabase.from("prayer_reports").insert({
        user_id: user.id,
        minister_name: form.minister_name.trim().slice(0, 150),
        church: form.church.trim().slice(0, 200),
        prayer_date: form.prayer_date,
        attendance,
        notes: form.notes.trim().slice(0, 4000) || null,
        contact_email: profile?.email ?? user.email ?? null,
        file_url,
        file_name,
      });
      if (error) throw error;

      toast.success("Report sent to the admin team. Thank you!");
      setForm(emptyForm);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-prayer-reports"] });
    } catch (err: any) {
      toast.error(err.message || "Could not send report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16">
        <div className="hero-gradient py-12 px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <ClipboardList className="w-10 h-10 text-accent mx-auto mb-3" />
            <h1 className="font-playfair text-3xl md:text-4xl font-bold">Send a Prayer Report</h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm md:text-base">
              Report your prayer meetings to the ISM Prayer Network admin team.
            </p>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 px-4 py-10 max-w-3xl mx-auto w-full space-y-10">
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-5 border border-border">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minister">Minister's Name *</Label>
              <Input
                id="minister"
                maxLength={150}
                value={form.minister_name}
                onChange={(e) => setForm((f) => ({ ...f, minister_name: e.target.value }))}
                placeholder="Pastor John Doe"
              />
            </div>
            <div>
              <Label htmlFor="church">Church / Ministry *</Label>
              <Input
                id="church"
                maxLength={200}
                value={form.church}
                onChange={(e) => setForm((f) => ({ ...f, church: e.target.value }))}
                placeholder="Christ Embassy ..."
              />
            </div>
            <div>
              <Label htmlFor="date">Prayer Date *</Label>
              <Input
                id="date"
                type="date"
                value={form.prayer_date}
                onChange={(e) => setForm((f) => ({ ...f, prayer_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="attendance">Attendance *</Label>
              <Input
                id="attendance"
                type="number"
                min={0}
                value={form.attendance}
                onChange={(e) => setForm((f) => ({ ...f, attendance: e.target.value }))}
                placeholder="e.g. 120"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Report Notes</Label>
            <Textarea
              id="notes"
              rows={5}
              maxLength={4000}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Highlights, testimonies, prayer focus..."
            />
          </div>

          <div>
            <Label htmlFor="file">Attach File (photo, PDF or document — max 15MB)</Label>
            <label
              htmlFor="file"
              className="mt-1 flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-4 cursor-pointer hover:border-accent transition-colors"
            >
              <Upload size={18} className="text-accent" />
              <span className="text-sm text-muted-foreground truncate">
                {file ? file.name : "Click to choose a file"}
              </span>
            </label>
            <input
              id="file"
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
            {submitting ? "Sending..." : "Send Report"}
          </Button>
          {!user && (
            <p className="text-xs text-muted-foreground">You need to sign in to send a report.</p>
          )}
        </form>

        {user && (
          <section>
            <h2 className="font-playfair text-2xl font-bold mb-4">My Submitted Reports</h2>
            {myReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">You haven't sent any reports yet.</p>
            ) : (
              <div className="space-y-3">
                {myReports.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{r.minister_name} — {r.church}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(r.prayer_date).toLocaleDateString()} · {r.attendance} in attendance
                        </p>
                        {r.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.notes}</p>}
                        {r.file_name && (
                          <p className="text-xs text-accent mt-2 flex items-center gap-1">
                            <FileText size={12} /> {r.file_name}
                          </p>
                        )}
                      </div>
                      <Badge variant={r.status === "reviewed" ? "default" : "secondary"} className="shrink-0 capitalize">
                        {r.status}
                      </Badge>
                    </div>
                    {r.admin_note && (
                      <p className="text-xs mt-3 rounded-md bg-muted/50 p-2">
                        <span className="font-medium">Admin note:</span> {r.admin_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SubmitReport;
