import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, UsersRound, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function csvEscape(v: any): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function PrayerGroupsManager() {
  const queryClient = useQueryClient();
  const [detailGroup, setDetailGroup] = useState<any | null>(null);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["admin-prayer-groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prayer_groups").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: participations } = useQuery({
    queryKey: ["admin-group-participations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_call_participations")
        .select("*")
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ["admin-group-members-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("group_members").select("group_id, user_id, joined_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

  const groupStats = (groupId: string) => {
    const rows = (participations || []).filter((r: any) => r.group_id === groupId);
    const totalSec = rows.reduce((a: number, r: any) => a + (r.duration_seconds || 0), 0);
    const lastPrayed = rows.length ? rows[0].joined_at : null;
    const sessions = rows.length;
    return { totalSec, lastPrayed, sessions, rows };
  };

  const groupMembers = (groupId: string) =>
    (members || [])
      .filter((m: any) => m.group_id === groupId)
      .map((m: any) => {
        const p: any = profileMap.get(m.user_id);
        return { user_id: m.user_id, name: p?.full_name || "Unknown", email: p?.email || "", joined_at: m.joined_at };
      });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this prayer group?")) return;
    try {
      const { error } = await supabase.from("prayer_groups").delete().eq("id", id);
      if (error) throw error;
      toast.success("Prayer group deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-prayer-groups"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const downloadFullReportCSV = () => {
    if (!groups?.length) return;
    const header = ["Group Name", "Visibility", "Members", "Sessions", "Total Prayer Time", "Total Seconds", "Last Prayed", "Participant Names"];
    const rows = groups.map((g: any) => {
      const s = groupStats(g.id);
      const mem = groupMembers(g.id);
      return [
        g.name,
        g.is_public ? "Public" : "Private",
        g.member_count,
        s.sessions,
        formatDuration(s.totalSec),
        s.totalSec,
        s.lastPrayed ? new Date(s.lastPrayed).toLocaleString() : "Never",
        mem.map(m => m.name).join("; "),
      ];
    });
    const csv = [header, ...rows].map(r => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prayer-groups-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadGroupCSV = (g: any) => {
    const s = groupStats(g.id);
    const mem = groupMembers(g.id);
    const lines: string[][] = [];
    lines.push(["Group", g.name]);
    lines.push(["Visibility", g.is_public ? "Public" : "Private"]);
    lines.push(["Members", String(g.member_count)]);
    lines.push(["Total Sessions", String(s.sessions)]);
    lines.push(["Total Prayer Time", formatDuration(s.totalSec)]);
    lines.push(["Last Prayed", s.lastPrayed ? new Date(s.lastPrayed).toLocaleString() : "Never"]);
    lines.push([]);
    lines.push(["Members List"]);
    lines.push(["Name", "Email", "Joined"]);
    mem.forEach(m => lines.push([m.name, m.email, new Date(m.joined_at).toLocaleString()]));
    lines.push([]);
    lines.push(["Prayer Sessions"]);
    lines.push(["Participant", "Joined At", "Left At", "Duration"]);
    s.rows.forEach((r: any) =>
      lines.push([
        r.participant_name,
        new Date(r.joined_at).toLocaleString(),
        r.left_at ? new Date(r.left_at).toLocaleString() : "—",
        formatDuration(r.duration_seconds || 0),
      ])
    );
    const csv = lines.map(r => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `group-${g.slug}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <UsersRound className="w-6 h-6 text-accent" />
          <h1 className="text-3xl font-bold">Prayer Groups</h1>
        </div>
        <Button onClick={downloadFullReportCSV} disabled={!groups?.length} className="gap-2">
          <Download size={15} /> Download Full Report
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !groups?.length ? (
        <p className="text-muted-foreground">No prayer groups yet.</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Total Prayed</TableHead>
                <TableHead>Last Prayed</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g: any) => {
                const s = groupStats(g.id);
                return (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>{g.member_count}</TableCell>
                    <TableCell>{s.sessions}</TableCell>
                    <TableCell>{formatDuration(s.totalSec)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.lastPrayed ? new Date(s.lastPrayed).toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge className={g.is_public ? "bg-green-500/20 text-green-700" : "bg-muted text-muted-foreground"}>
                        {g.is_public ? "Public" : "Private"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDetailGroup(g)}>
                        <Eye size={15} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => downloadGroupCSV(g)} title="Download CSV">
                        <Download size={15} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)} className="text-destructive">
                        <Trash2 size={15} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!detailGroup} onOpenChange={() => setDetailGroup(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailGroup?.name} — Report</DialogTitle>
          </DialogHeader>
          {detailGroup && (() => {
            const s = groupStats(detailGroup.id);
            const mem = groupMembers(detailGroup.id);
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Members</p><p className="text-xl font-semibold">{detailGroup.member_count}</p></div>
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Sessions</p><p className="text-xl font-semibold">{s.sessions}</p></div>
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Total Prayed</p><p className="text-xl font-semibold">{formatDuration(s.totalSec)}</p></div>
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Last Prayed</p><p className="text-sm font-medium">{s.lastPrayed ? new Date(s.lastPrayed).toLocaleString() : "Never"}</p></div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Members ({mem.length})</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {mem.map(m => (
                          <TableRow key={m.user_id}>
                            <TableCell>{m.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{m.email}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{new Date(m.joined_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Prayer Sessions ({s.sessions})</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader><TableRow><TableHead>Participant</TableHead><TableHead>Joined</TableHead><TableHead>Left</TableHead><TableHead>Duration</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {s.rows.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No prayer sessions yet</TableCell></TableRow>
                        ) : s.rows.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.participant_name}</TableCell>
                            <TableCell className="text-sm">{new Date(r.joined_at).toLocaleString()}</TableCell>
                            <TableCell className="text-sm">{r.left_at ? new Date(r.left_at).toLocaleString() : "—"}</TableCell>
                            <TableCell>{formatDuration(r.duration_seconds || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => downloadGroupCSV(detailGroup)} className="gap-2"><Download size={15} /> Download CSV</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
