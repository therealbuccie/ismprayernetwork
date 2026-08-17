import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Download, RefreshCw, Search, Eye } from "lucide-react";
import { toast } from "sonner";

interface LogRow {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  record_label: string | null;
  changed_fields: string[] | null;
  old_data: any;
  new_data: any;
}

const ACTION_STYLES: Record<string, string> = {
  INSERT: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  UPDATE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/15 text-red-400 border-red-500/30",
};

const ACTION_LABEL: Record<string, string> = {
  INSERT: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
};

const PAGE_SIZE = 50;
const HIDDEN_KEYS = ["id", "created_at", "updated_at"];

const prettyTable = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const formatValue = (v: any) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  return s.length > 300 ? s.slice(0, 300) + "…" : s;
};

export function ActivityLogManager() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("7");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<LogRow | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (tableFilter !== "all") q = q.eq("table_name", tableFilter);
    if (actionFilter !== "all") q = q.eq("action", actionFilter);
    if (rangeFilter !== "all") {
      const since = new Date(Date.now() - parseInt(rangeFilter, 10) * 86400000).toISOString();
      q = q.gte("created_at", since);
    }

    const { data, error, count } = await q;
    if (error) toast.error(error.message);
    setLogs((data as LogRow[]) || []);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, tableFilter, actionFilter, rangeFilter]);
  useEffect(() => { setPage(0); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tableFilter, actionFilter, rangeFilter]);

  // live updates
  useEffect(() => {
    const channel = supabase
      .channel("activity-logs-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, () => {
        if (page === 0) load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tableFilter, actionFilter, rangeFilter]);

  const [tables, setTables] = useState<string[]>([]);
  useEffect(() => {
    supabase.from("activity_logs").select("table_name").limit(2000).then(({ data }) => {
      setTables(Array.from(new Set((data || []).map((r: any) => r.table_name))).sort());
    });
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return logs;
    return logs.filter(l =>
      [l.actor_email, l.table_name, l.record_label, l.record_id, (l.changed_fields || []).join(" ")]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(s))
    );
  }, [logs, search]);

  const exportCsv = async () => {
    let q = supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(5000);
    if (tableFilter !== "all") q = q.eq("table_name", tableFilter);
    if (actionFilter !== "all") q = q.eq("action", actionFilter);
    if (rangeFilter !== "all") {
      q = q.gte("created_at", new Date(Date.now() - parseInt(rangeFilter, 10) * 86400000).toISOString());
    }
    const { data, error } = await q;
    if (error) { toast.error(error.message); return; }
    const rows = (data as LogRow[]) || [];
    const head = ["Timestamp", "Actor", "Role", "Action", "Table", "Record", "Record ID", "Changed Fields", "Details"];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [head.join(",")].concat(rows.map(r => [
      new Date(r.created_at).toLocaleString(),
      r.actor_email || "System",
      r.actor_role || "",
      ACTION_LABEL[r.action] || r.action,
      prettyTable(r.table_name),
      r.record_label || "",
      r.record_id || "",
      (r.changed_fields || []).join(" | "),
      JSON.stringify(r.new_data ?? r.old_data ?? {}),
    ].map(esc).join(","))).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} log entries`);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const diffRows = (log: LogRow) => {
    const keys = new Set<string>([
      ...Object.keys(log.new_data || {}),
      ...Object.keys(log.old_data || {}),
    ]);
    return Array.from(keys)
      .filter(k => !HIDDEN_KEYS.includes(k))
      .filter(k => log.action !== "UPDATE" || (log.changed_fields || []).includes(k))
      .sort();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-accent" /> Activity Log
          </h1>
          <p className="text-sm text-muted-foreground">Every create, update and delete across the backend — who did it and what changed.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search actor, record, field…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger><SelectValue placeholder="All areas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {tables.map(t => <SelectItem key={t} value={t}>{prettyTable(t)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger><SelectValue placeholder="All actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="INSERT">Created</SelectItem>
              <SelectItem value="UPDATE">Updated</SelectItem>
              <SelectItem value="DELETE">Deleted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={rangeFilter} onValueChange={setRangeFilter}>
            <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{total} entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Who</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Record</th>
                  <th className="px-4 py-3">Changed</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="px-4 py-6"><Skeleton className="h-24 w-full" /></td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No activity recorded for this filter yet.</td></tr>
                )}
                {!loading && filtered.map(l => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium truncate max-w-[180px]">{l.actor_email || "System / Automation"}</div>
                      {l.actor_role && <div className="text-[10px] uppercase text-muted-foreground">{l.actor_role}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={ACTION_STYLES[l.action] || ""}>{ACTION_LABEL[l.action] || l.action}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{prettyTable(l.table_name)}</td>
                    <td className="px-4 py-3 max-w-[220px] truncate">{l.record_label || l.record_id || "—"}</td>
                    <td className="px-4 py-3 max-w-[220px] truncate text-xs text-muted-foreground">
                      {(l.changed_fields || []).map(f => f.replace(/_/g, " ")).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDetail(l)}><Eye className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {detail ? `${ACTION_LABEL[detail.action] || detail.action} · ${prettyTable(detail.table_name)}` : ""}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">When</p><p>{new Date(detail.created_at).toLocaleString()}</p></div>
                  <div><p className="text-xs text-muted-foreground">Performed by</p><p>{detail.actor_email || "System / Automation"}{detail.actor_role ? ` (${detail.actor_role})` : ""}</p></div>
                  <div><p className="text-xs text-muted-foreground">Record</p><p>{detail.record_label || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Record ID</p><p className="font-mono text-xs break-all">{detail.record_id || "—"}</p></div>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40">
                      <tr className="text-left">
                        <th className="px-3 py-2">Field</th>
                        <th className="px-3 py-2">Before</th>
                        <th className="px-3 py-2">After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diffRows(detail).map(k => (
                        <tr key={k} className="border-t border-border/50 align-top">
                          <td className="px-3 py-2 font-medium whitespace-nowrap">{k.replace(/_/g, " ")}</td>
                          <td className="px-3 py-2 text-muted-foreground break-all">{formatValue(detail.old_data?.[k])}</td>
                          <td className="px-3 py-2 break-all">{formatValue(detail.new_data?.[k])}</td>
                        </tr>
                      ))}
                      {diffRows(detail).length === 0 && (
                        <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">No field details recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
