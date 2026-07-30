import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Download, FileText, Search, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: string;
  minister_name: string;
  church: string;
  prayer_date: string;
  attendance: number;
  notes: string | null;
  file_url: string | null;
  file_name: string | null;
  contact_email: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

export function ReportsManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [note, setNote] = useState("");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["prayer-reports-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Report[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_note }: { id: string; status?: string; admin_note?: string }) => {
      const patch: Record<string, unknown> = {};
      if (status) patch.status = status;
      if (admin_note !== undefined) patch.admin_note = admin_note;
      const { error } = await supabase.from("prayer_reports").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-reports-admin"] });
      toast.success("Report updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prayer_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-reports-admin"] });
      setSelected(null);
      toast.success("Report deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("report-uploads").createSignedUrl(path, 3600);
    if (error || !data) return toast.error("Could not open file");
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) =>
      `${r.minister_name} ${r.church} ${r.contact_email ?? ""} ${r.notes ?? ""}`.toLowerCase().includes(q)
    );
  }, [reports, search]);

  const exportCsv = () => {
    const header = ["Minister", "Church", "Prayer Date", "Attendance", "Status", "Email", "Notes", "Submitted"];
    const rows = filtered.map((r) => [
      r.minister_name, r.church, r.prayer_date, r.attendance, r.status,
      r.contact_email ?? "", (r.notes ?? "").replace(/\s+/g, " "), new Date(r.created_at).toISOString(),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `prayer-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalAttendance = filtered.reduce((s, r) => s + (r.attendance || 0), 0);
  const pending = reports.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-accent" /> Reports
        </h1>
        <Button size="sm" variant="outline" onClick={exportCsv} className="gap-2">
          <Download size={14} /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Reports", value: reports.length },
          { label: "Pending Review", value: pending },
          { label: "Total Attendance", value: totalAttendance.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
        <Input placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No reports yet.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelected(r); setNote(r.admin_note ?? ""); }}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.minister_name} — {r.church}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(r.prayer_date).toLocaleDateString()} · {r.attendance} attendance
                  {r.file_name ? " · has attachment" : ""}
                </p>
                {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.notes}</p>}
              </div>
              <Badge variant={r.status === "reviewed" ? "default" : "secondary"} className="capitalize shrink-0">
                {r.status}
              </Badge>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prayer Report</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Minister</p><p className="font-medium">{selected.minister_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Church</p><p className="font-medium">{selected.church}</p></div>
                <div><p className="text-xs text-muted-foreground">Prayer Date</p><p className="font-medium">{new Date(selected.prayer_date).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Attendance</p><p className="font-medium">{selected.attendance}</p></div>
                {selected.contact_email && (
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Email</p><p className="font-medium break-all">{selected.contact_email}</p></div>
                )}
              </div>
              {selected.notes && (
                <div><p className="text-xs text-muted-foreground mb-1">Notes</p><p className="whitespace-pre-line">{selected.notes}</p></div>
              )}
              {selected.file_url && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => openFile(selected.file_url!)}>
                  <FileText size={14} /> View attachment{selected.file_name ? `: ${selected.file_name}` : ""}
                </Button>
              )}
              <div>
                <Label>Admin note</Label>
                <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note / feedback" />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive gap-2"
                  onClick={() => { if (confirm("Delete this report?")) deleteMutation.mutate(selected.id); }}
                >
                  <Trash2 size={14} /> Delete
                </Button>
                <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: selected.id, admin_note: note })}>
                  Save note
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => updateMutation.mutate({
                    id: selected.id,
                    status: selected.status === "reviewed" ? "pending" : "reviewed",
                    admin_note: note,
                  })}
                >
                  <CheckCircle2 size={14} /> {selected.status === "reviewed" ? "Mark pending" : "Mark reviewed"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
