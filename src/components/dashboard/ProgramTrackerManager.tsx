import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Download, MousePointerClick, Mail, MailOpen, ClipboardCheck, Globe, RefreshCw } from "lucide-react";

interface Engagement {
  id: string;
  dispatch_id: string;
  program_id: string | null;
  email: string;
  full_name: string | null;
  country: string | null;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
}

interface Dispatch {
  id: string;
  program_id: string | null;
  program_title: string | null;
  subject: string;
  recipient_count: number;
  match_mode: string;
  sent_at: string;
}

interface ProgramRow {
  id: string;
  title: string;
  event_date: string | null;
}

interface ReportRow {
  id: string;
  contact_email: string | null;
  minister_name: string;
  prayer_date: string;
  attendance: number;
}

const DAY = 24 * 60 * 60 * 1000;

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProgramTrackerManager() {
  const [programFilter, setProgramFilter] = useState("all");
  const [engagementFilter, setEngagementFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [rangeDays, setRangeDays] = useState("90");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["program-tracker"],
    queryFn: async () => {
      const [engRes, dispRes, progRes, repRes] = await Promise.all([
        supabase.from("program_engagements").select("*").order("sent_at", { ascending: false }).limit(20000),
        supabase.from("program_dispatches").select("*").order("sent_at", { ascending: false }),
        supabase.from("programs").select("id, title, event_date"),
        supabase.from("prayer_reports").select("id, contact_email, minister_name, prayer_date, attendance"),
      ]);
      if (engRes.error) throw engRes.error;
      if (dispRes.error) throw dispRes.error;
      if (progRes.error) throw progRes.error;
      return {
        engagements: (engRes.data || []) as Engagement[],
        dispatches: (dispRes.data || []) as Dispatch[],
        programs: (progRes.data || []) as ProgramRow[],
        reports: (repRes.data || []) as ReportRow[],
      };
    },
  });

  const engagements = data?.engagements || [];
  const dispatches = data?.dispatches || [];
  const programs = data?.programs || [];
  const reports = data?.reports || [];

  const programById = useMemo(() => {
    const m = new Map<string, ProgramRow>();
    programs.forEach((p) => m.set(p.id, p));
    return m;
  }, [programs]);

  // Match reports to programs by minister email + closest program date
  const reportedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const r of reports) {
      const email = (r.contact_email || "").trim().toLowerCase();
      if (!email || !r.prayer_date) continue;
      const reportTime = new Date(r.prayer_date).getTime();
      for (const p of programs) {
        if (!p.event_date) continue;
        if (Math.abs(new Date(p.event_date).getTime() - reportTime) <= 3 * DAY) {
          keys.add(`${p.id}|${email}`);
        }
      }
    }
    return keys;
  }, [reports, programs]);

  const cutoff = useMemo(() => {
    if (rangeDays === "all") return 0;
    return Date.now() - Number(rangeDays) * DAY;
  }, [rangeDays]);

  const enriched = useMemo(() => {
    return engagements
      .filter((e) => new Date(e.sent_at).getTime() >= cutoff)
      .map((e) => {
        const email = e.email.toLowerCase();
        const reported = e.program_id ? reportedKeys.has(`${e.program_id}|${email}`) : false;
        return {
          ...e,
          email,
          reported,
          participated: reported || !!e.clicked_at || !!e.opened_at,
          programTitle:
            (e.program_id && programById.get(e.program_id)?.title) ||
            dispatches.find((d) => d.id === e.dispatch_id)?.program_title ||
            "Unlinked",
        };
      });
  }, [engagements, cutoff, reportedKeys, programById, dispatches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((e) => {
      if (programFilter !== "all" && e.program_id !== programFilter) return false;
      if (countryFilter !== "all" && (e.country || "Unknown") !== countryFilter) return false;
      if (engagementFilter === "opened" && !e.opened_at) return false;
      if (engagementFilter === "clicked" && !e.clicked_at) return false;
      if (engagementFilter === "reported" && !e.reported) return false;
      if (engagementFilter === "none" && e.participated) return false;
      if (q && !e.email.includes(q) && !(e.full_name || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [enriched, programFilter, countryFilter, engagementFilter, search]);

  const stats = useMemo(() => {
    const emails = new Set(filtered.map((e) => e.email));
    const opened = new Set(filtered.filter((e) => e.opened_at).map((e) => e.email));
    const clicked = new Set(filtered.filter((e) => e.clicked_at).map((e) => e.email));
    const reported = new Set(filtered.filter((e) => e.reported).map((e) => e.email));
    const participants = new Set(filtered.filter((e) => e.participated).map((e) => e.email));
    return {
      sent: emails.size,
      opened: opened.size,
      clicked: clicked.size,
      reported: reported.size,
      participants: participants.size,
      rate: emails.size ? Math.round((participants.size / emails.size) * 100) : 0,
    };
  }, [filtered]);

  const perProgram = useMemo(() => {
    const map = new Map<string, { id: string; title: string; sent: Set<string>; opened: Set<string>; clicked: Set<string>; reported: Set<string>; lastSent: string }>();
    for (const e of filtered) {
      const key = e.program_id || "unlinked";
      if (!map.has(key)) {
        map.set(key, { id: key, title: e.programTitle, sent: new Set(), opened: new Set(), clicked: new Set(), reported: new Set(), lastSent: e.sent_at });
      }
      const row = map.get(key)!;
      row.sent.add(e.email);
      if (e.opened_at) row.opened.add(e.email);
      if (e.clicked_at) row.clicked.add(e.email);
      if (e.reported) row.reported.add(e.email);
      if (new Date(e.sent_at) > new Date(row.lastSent)) row.lastSent = e.sent_at;
    }
    return Array.from(map.values())
      .map((r) => {
        const participants = new Set([...r.opened, ...r.clicked, ...r.reported]);
        return {
          id: r.id,
          title: r.title,
          sent: r.sent.size,
          opened: r.opened.size,
          clicked: r.clicked.size,
          reported: r.reported.size,
          participants: participants.size,
          rate: r.sent.size ? Math.round((participants.size / r.sent.size) * 100) : 0,
          lastSent: r.lastSent,
        };
      })
      .sort((a, b) => b.participants - a.participants);
  }, [filtered]);

  const perMinister = useMemo(() => {
    const map = new Map<string, { email: string; name: string; country: string; programs: Set<string>; engaged: Set<string>; clicks: number; opens: number; reports: number; last: string }>();
    for (const e of filtered) {
      if (!map.has(e.email)) {
        map.set(e.email, { email: e.email, name: e.full_name || "—", country: e.country || "Unknown", programs: new Set(), engaged: new Set(), clicks: 0, opens: 0, reports: 0, last: e.sent_at });
      }
      const row = map.get(e.email)!;
      row.programs.add(e.programTitle);
      if (e.participated) row.engaged.add(e.programTitle);
      if (e.clicked_at) row.clicks += 1;
      if (e.opened_at) row.opens += 1;
      if (e.reported) row.reports += 1;
      if (new Date(e.sent_at) > new Date(row.last)) row.last = e.sent_at;
      if (!row.name || row.name === "—") row.name = e.full_name || row.name;
    }
    return Array.from(map.values())
      .map((r) => ({
        ...r,
        invited: r.programs.size,
        attended: r.engaged.size,
        score: r.programs.size ? Math.round((r.engaged.size / r.programs.size) * 100) : 0,
      }))
      .sort((a, b) => b.attended - a.attended || b.score - a.score);
  }, [filtered]);

  const perCountry = useMemo(() => {
    const map = new Map<string, { country: string; sent: Set<string>; participants: Set<string> }>();
    for (const e of filtered) {
      const c = e.country || "Unknown";
      if (!map.has(c)) map.set(c, { country: c, sent: new Set(), participants: new Set() });
      const row = map.get(c)!;
      row.sent.add(e.email);
      if (e.participated) row.participants.add(e.email);
    }
    return Array.from(map.values())
      .map((r) => ({
        country: r.country,
        sent: r.sent.size,
        participants: r.participants.size,
        rate: r.sent.size ? Math.round((r.participants.size / r.sent.size) * 100) : 0,
      }))
      .sort((a, b) => b.participants - a.participants);
  }, [filtered]);

  const countryOptions = useMemo(
    () => Array.from(new Set(enriched.map((e) => e.country || "Unknown"))).sort(),
    [enriched]
  );

  const exportParticipants = () => {
    downloadCsv(
      `program-participation-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ["Program", "Minister", "Email", "Country", "Sent", "Opened", "Clicked", "Report Submitted", "Participated"],
        ...filtered.map((e) => [
          e.programTitle,
          e.full_name || "",
          e.email,
          e.country || "Unknown",
          new Date(e.sent_at).toLocaleString(),
          e.opened_at ? new Date(e.opened_at).toLocaleString() : "",
          e.clicked_at ? new Date(e.clicked_at).toLocaleString() : "",
          e.reported ? "Yes" : "No",
          e.participated ? "Yes" : "No",
        ]),
      ]
    );
  };

  const exportMinisters = () => {
    downloadCsv(
      `minister-participation-history-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ["Minister", "Email", "Country", "Programs Invited", "Programs Participated", "Engagement %", "Opens", "Clicks", "Reports", "Last Email"],
        ...perMinister.map((m) => [
          m.name,
          m.email,
          m.country,
          m.invited,
          m.attended,
          `${m.score}%`,
          m.opens,
          m.clicks,
          m.reports,
          new Date(m.last).toLocaleString(),
        ]),
      ]
    );
  };

  const statCards = [
    { label: "Ministers Emailed", value: stats.sent, icon: Mail },
    { label: "Opened", value: stats.opened, icon: MailOpen },
    { label: "Clicked Program Link", value: stats.clicked, icon: MousePointerClick },
    { label: "Reports Submitted", value: stats.reported, icon: ClipboardCheck },
    { label: "Participation Rate", value: `${stats.rate}%`, icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Activity className="w-7 h-7 text-accent" />
          <h1 className="text-3xl font-bold">Program Tracker</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} className={`mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={exportParticipants} disabled={!filtered.length}>
            <Download size={14} className="mr-1" /> Export CSV
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Participation is measured from email dispatches linked to a program: opens, registration-link clicks, and
        reports submitted afterwards. Opens are indicative only — some inboxes block tracking images — so clicks and
        reports are the strongest signals.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className="w-4 h-4 text-accent" />
              </div>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs">Program</Label>
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Engagement</Label>
            <Select value={engagementFilter} onValueChange={setEngagementFilter}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All recipients</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="clicked">Clicked link</SelectItem>
                <SelectItem value="reported">Submitted report</SelectItem>
                <SelectItem value="none">No engagement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Country</Label>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">All countries</SelectItem>
                {countryOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Period</Label>
            <Select value={rangeDays} onValueChange={setRangeDays}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last 12 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Search minister</Label>
            <Input className="mt-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading participation data...</p>
      ) : enriched.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <p className="font-medium">No tracked dispatches yet</p>
            <p className="text-sm text-muted-foreground">
              Link a dispatch to a program in Mail Dispatch (or include the program's registration link in the email)
              and participation will start recording here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="programs">
          <TabsList>
            <TabsTrigger value="programs">By Program</TabsTrigger>
            <TabsTrigger value="ministers">By Minister</TabsTrigger>
            <TabsTrigger value="countries">By Country</TabsTrigger>
            <TabsTrigger value="dispatches">Dispatches</TabsTrigger>
          </TabsList>

          <TabsContent value="programs" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Participation per program</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program</TableHead>
                      <TableHead className="text-right">Emailed</TableHead>
                      <TableHead className="text-right">Opened</TableHead>
                      <TableHead className="text-right">Clicked</TableHead>
                      <TableHead className="text-right">Reports</TableHead>
                      <TableHead className="text-right">Participants</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead>Last dispatch</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perProgram.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell className="text-right">{p.sent}</TableCell>
                        <TableCell className="text-right">{p.opened}</TableCell>
                        <TableCell className="text-right">{p.clicked}</TableCell>
                        <TableCell className="text-right">{p.reported}</TableCell>
                        <TableCell className="text-right font-semibold">{p.participants}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={p.rate >= 30 ? "default" : "secondary"}>{p.rate}%</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(p.lastSent).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ministers" className="mt-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg">Minister participation history</CardTitle>
                <Button variant="outline" size="sm" onClick={exportMinisters}>
                  <Download size={14} className="mr-1" /> Export
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Minister</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Invited</TableHead>
                      <TableHead className="text-right">Participated</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Reports</TableHead>
                      <TableHead className="text-right">Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perMinister.slice(0, 300).map((m) => (
                      <TableRow key={m.email}>
                        <TableCell>
                          <p className="font-medium">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </TableCell>
                        <TableCell className="text-sm">{m.country}</TableCell>
                        <TableCell className="text-right">{m.invited}</TableCell>
                        <TableCell className="text-right font-semibold">{m.attended}</TableCell>
                        <TableCell className="text-right">{m.clicks}</TableCell>
                        <TableCell className="text-right">{m.reports}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={m.score >= 50 ? "default" : "secondary"}>{m.score}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {perMinister.length > 300 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Showing top 300 of {perMinister.length}. Export the CSV for the full list.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="countries" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" /> Participation by country
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {perCountry.map((c) => (
                  <button
                    key={c.country}
                    onClick={() => setCountryFilter(c.country)}
                    className="px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted transition text-left"
                  >
                    <p className="text-sm font-medium">{c.country}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.participants} of {c.sent} · {c.rate}%
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dispatches" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Tracked dispatches</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead className="text-right">Recipients</TableHead>
                      <TableHead>Linked</TableHead>
                      <TableHead>Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatches.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.subject}</TableCell>
                        <TableCell>{d.program_title || "—"}</TableCell>
                        <TableCell className="text-right">{d.recipient_count}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{d.match_mode === "auto" ? "Auto-detected" : "Manual"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(d.sent_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
