import { useState, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, Profile } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Database, Users, Globe, ShieldCheck, Search, Upload, Download, Trash2, Plus, RefreshCw, FileSpreadsheet, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { COUNTRIES } from "@/lib/countries";


const PAGE_SIZE = 50;

type Contact = {
  id: string;
  title: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  source: string;
  created_at: string;
};

const COLUMNS = ["title", "first_name", "last_name", "email", "phone", "country"] as const;

const HEADER_ALIASES: Record<string, string> = {
  title: "title", salutation: "title", prefix: "title",
  first_name: "first_name", firstname: "first_name", "first name": "first_name", given_name: "first_name",
  last_name: "last_name", lastname: "last_name", "last name": "last_name", surname: "last_name", family_name: "last_name",
  email: "email", "email address": "email", mail: "email",
  phone: "phone", "phone number": "phone", mobile: "phone", telephone: "phone", number: "phone",
  country: "country", nation: "country",
};

function normalizeRow(raw: Record<string, any>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = HEADER_ALIASES[String(k).trim().toLowerCase()];
    if (!key) continue;
    out[key] = v === null || v === undefined ? "" : String(v).trim();
  }
  return out;
}

function toCSV(rows: Record<string, any>[], cols: string[]) {
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
}

function download(name: string, content: BlobPart, type = "text/csv;charset=utf-8;") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

const roleOptions = [
  { value: "customer", label: "Customer", icon: UserIcon },
  { value: "admin", label: "Admin", icon: Shield },
  { value: "super-admin", label: "Super Admin", icon: ShieldCheck },
];

const roleBadgeColor: Record<string, string> = {
  "super-admin": "bg-accent text-accent-foreground",
  admin: "bg-primary text-primary-foreground",
  customer: "bg-muted text-muted-foreground",
};

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center text-accent shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

const isProfileComplete = (p: any) =>
  !!(p?.full_name?.trim() && p?.ministry_name?.trim() && p?.country?.trim() &&
     p?.phone?.trim() && p?.title?.trim() && p?.ministerial_role?.trim());

type ViewFilter = "all" | "accounts" | "upgraded";

/** phpMyAdmin-style inline editable cell: click to edit, Enter/blur saves, Esc cancels. */
function EditableCell({
  value,
  onSave,
  options,
  className = "",
}: {
  value: string | null | undefined;
  onSave: (next: string) => Promise<void>;
  options?: readonly string[];
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const listId = useMemo(() => `dl-${Math.random().toString(36).slice(2)}`, []);

  const commit = async () => {
    setEditing(false);
    const next = draft.trim();
    if (next === (value ?? "")) return;
    setSaving(true);
    await onSave(next);
    setSaving(false);
  };

  if (editing) {
    return (
      <TableCell className={className}>
        <input
          autoFocus
          value={draft}
          list={options ? listId : undefined}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
          }}
          className="w-full min-w-[90px] rounded border border-accent bg-background px-1.5 py-1 text-xs outline-none"
        />
        {options && (
          <datalist id={listId}>
            {options.map(o => <option key={o} value={o} />)}
          </datalist>
        )}
      </TableCell>
    );
  }

  return (
    <TableCell
      className={`cursor-text hover:bg-accent/10 transition-colors ${saving ? "opacity-50" : ""} ${className}`}
      title="Click to edit"
      onClick={() => { setDraft(value ?? ""); setEditing(true); }}
    >
      {value || <span className="text-muted-foreground">—</span>}
    </TableCell>
  );
}


export function DatabaseManager() {
  const { profile: currentProfile } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewFilter>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at.desc");
  const [page, setPage] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newContact, setNewContact] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ email: "", full_name: "", password: "", role: "admin", country: "" });


  // ---- Contacts (server paged) ----
  const { data: contactData, isLoading, isFetching } = useQuery({
    queryKey: ["db-contacts", search, page, countryFilter, sortBy],
    queryFn: async () => {
      let q = supabase.from("contacts").select("*", { count: "exact" });
      const term = search.trim().replace(/[%,()]/g, "");
      if (term) q = q.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,country.ilike.%${term}%`);
      if (countryFilter === "none") q = q.is("country", null);
      else if (countryFilter !== "all") q = q.ilike("country", countryFilter);
      const [col, dir] = sortBy.split(".");
      const { data, error, count } = await q
        .order(col, { ascending: dir === "asc", nullsFirst: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: (data || []) as Contact[], count: count || 0 };
    },
  });

  // ---- Aggregate stats (head counts — not limited to 1000) ----
  const { data: meta } = useQuery({
    queryKey: ["db-contacts-meta"],
    queryFn: async () => {
      const { count } = await supabase.from("contacts").select("*", { count: "exact", head: true });
      const tally = new Map<string, number>();
      let unknown = 0;
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("contacts").select("country").range(from, from + 999);
        if (error) throw error;
        (data || []).forEach((d: any) => {
          const raw = String(d.country || "").trim();
          if (!raw) { unknown++; return; }
          const key = raw.replace(/\b\w/g, c => c.toUpperCase());
          tally.set(key, (tally.get(key) || 0) + 1);
        });
        if (!data || data.length < 1000) break;
      }
      const list = [...tally.entries()].sort((a, b) => b[1] - a[1]);
      return { total: count || 0, countries: tally.size, countryList: list, unknown };
    },
  });


  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const profileByEmail = useMemo(() => {
    const m = new Map<string, Profile>();
    (profiles || []).forEach(p => { if (p.email) m.set(p.email.toLowerCase(), p); });
    return m;
  }, [profiles]);

  const upgraded = (profiles || []).filter(p => p.role === "admin" || p.role === "super-admin");

  // Account rows (client filtered/sorted) for the "accounts" / "upgraded" views
  const accountRows = useMemo(() => {
    let base = view === "upgraded" ? upgraded : (profiles || []);
    const term = search.trim().toLowerCase();
    if (term) base = base.filter(p =>
      (p.email || "").toLowerCase().includes(term) ||
      (p.full_name || "").toLowerCase().includes(term) ||
      (p.country || "").toLowerCase().includes(term)
    );
    if (countryFilter === "none") base = base.filter(p => !p.country);
    else if (countryFilter !== "all") base = base.filter(p => (p.country || "").toLowerCase() === countryFilter.toLowerCase());
    const [col, dir] = sortBy.split(".");
    const asc = dir === "asc" ? 1 : -1;
    const key = (p: Profile) => {
      if (col === "first_name") return (p.full_name || p.email || "").toLowerCase();
      if (col === "last_name") return (p.full_name || "").split(" ").slice(-1)[0]?.toLowerCase() || "";
      if (col === "country") return (p.country || "").toLowerCase();
      if (col === "email") return (p.email || "").toLowerCase();
      return p.created_at || "";
    };
    return [...base].sort((a, b) => (key(a) > key(b) ? asc : key(a) < key(b) ? -asc : 0));
  }, [profiles, view, search, countryFilter, sortBy]);


  const isAccountView = view !== "all";
  const totalRows = isAccountView ? accountRows.length : (contactData?.count || 0);
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const pagedAccounts = accountRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["db-contacts"] });
    queryClient.invalidateQueries({ queryKey: ["db-contacts-meta"] });
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
  };

  // ---- Bulk upload ----
  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
      let rows = json.map(normalizeRow).filter(r => Object.keys(r).length);

      if (!rows.length) {
        const arr = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });
        rows = arr.map((r) => {
          const offset = r.length >= 7 ? 1 : 0;
          return {
            title: String(r[offset] ?? "").trim(),
            first_name: String(r[offset + 1] ?? "").trim(),
            last_name: String(r[offset + 2] ?? "").trim(),
            email: String(r[offset + 3] ?? "").trim(),
            phone: String(r[offset + 4] ?? "").trim(),
            country: String(r[offset + 5] ?? "").trim(),
          };
        }).filter(r => r.email || r.first_name || r.last_name);
      }

      if (!rows.length) { toast.error("No readable rows found in that file"); return; }
      setPreview(rows);
      toast.success(`${rows.length} rows detected`);
    } catch (e: any) {
      toast.error("Could not read file: " + e.message);
    }
  };

  const runImport = async () => {
    if (!preview) return;
    setUploading(true); setProgress(0);
    try {
      const cleaned = preview.map(r => ({
        title: r.title || null,
        first_name: r.first_name || "",
        last_name: r.last_name || "",
        email: (r.email || "").replace(/\s/g, "").toLowerCase() || null,
        phone: r.phone || null,
        country: r.country || null,
        source: "bulk_upload",
      })).filter(r => r.email || r.first_name || r.last_name);

      const seen = new Set<string>();
      const unique = cleaned.filter(r => {
        if (!r.email) return true;
        if (seen.has(r.email)) return false;
        seen.add(r.email); return true;
      });

      const CHUNK = 500;
      let processed = 0;
      let skipped = 0;
      for (let i = 0; i < unique.length; i += CHUNK) {
        const chunk = unique.slice(i, i + CHUNK);
        const emails = chunk.map(r => r.email).filter(Boolean) as string[];
        let existing = new Set<string>();
        if (emails.length) {
          const { data: found, error: findErr } = await supabase.from("contacts").select("email").in("email", emails);
          if (findErr) throw findErr;
          existing = new Set((found || []).map((f: any) => (f.email || "").toLowerCase()));
        }
        const toInsert = chunk.filter(r => !r.email || !existing.has(r.email));
        skipped += chunk.length - toInsert.length;
        if (toInsert.length) {
          const { error } = await supabase.from("contacts").insert(toInsert);
          if (error) throw error;
        }
        processed += chunk.length;
        setProgress(Math.round((processed / unique.length) * 100));
      }
      if (skipped) toast.info(`${skipped} existing email(s) skipped`);
      toast.success(`Imported ${unique.length - skipped} records`);
      setPreview(null); setUploadOpen(false);
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false); setProgress(0);
    }
  };

  const downloadSample = (type: "csv" | "xlsx") => {
    const sample = [
      { title: "Pastor", first_name: "John", last_name: "Doe", email: "john.doe@example.com", phone: "2348012345678", country: "Nigeria" },
      { title: "Sister", first_name: "Mary", last_name: "Grace", email: "mary.grace@example.com", phone: "2348098765432", country: "Ghana" },
    ];
    if (type === "csv") {
      download("contacts-sample.csv", toCSV(sample, [...COLUMNS]));
    } else {
      const ws = XLSX.utils.json_to_sheet(sample, { header: [...COLUMNS] });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Contacts");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      download("contacts-sample.xlsx", out, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }
  };

  const exportAll = async () => {
    toast.info("Preparing export...");
    const all: any[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false }).range(from, from + 999);
      if (error) { toast.error(error.message); return; }
      all.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    const rowsOut = all.map(c => {
      const p: any = profileByEmail.get((c.email || "").toLowerCase());
      return {
        ...c,
        title: c.title || p?.title || "",
        phone: c.phone || p?.phone || "",
        country: c.country || p?.country || "",
        ministry_name: p?.ministry_name || "",
        ministerial_role: p?.ministerial_role || "",
        city: p?.city || "",
        role: p?.role || "",
      };
    });
    download(`database-export-${new Date().toISOString().split("T")[0]}.csv`, toCSV(rowsOut, [...COLUMNS, "ministry_name", "ministerial_role", "city", "role", "created_at"]));
    toast.success(`Exported ${all.length} records`);
  };

  const addContact = async () => {
    if (!newContact.first_name && !newContact.email) { toast.error("Name or email required"); return; }
    const { error } = await supabase.from("contacts").insert({
      title: newContact.title || null,
      first_name: newContact.first_name || "",
      last_name: newContact.last_name || "",
      email: newContact.email?.toLowerCase() || null,
      phone: newContact.phone || null,
      country: newContact.country || null,
      source: "manual",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Record added");
    setAddOpen(false); setNewContact({}); refresh();
  };

  const createAccount = async () => {
    const email = newAccount.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error("Enter a valid email"); return; }
    const exists = profileByEmail.has(email);
    if (!exists && newAccount.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setSavingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { email, full_name: newAccount.full_name, password: newAccount.password, role: newAccount.role, country: newAccount.country },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success((data as any)?.status === "upgraded" ? "Existing account upgraded" : "Account created");
      setAccountOpen(false);
      setNewAccount({ email: "", full_name: "", password: "", role: "admin", country: "" });
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Could not create account");
    } finally {
      setSavingAccount(false);
    }
  };


  const saveField = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("contacts").update({ [field]: value || null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    refresh();
  };

  const removeContact = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Record deleted"); refresh();
  };

  const changeRole = async (profileId: string, newRole: string) => {
    setUpdatingId(profileId);
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", profileId);
    setUpdatingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Role updated");
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
  };

  const changeCountry = async (profileId: string, newCountry: string) => {
    setUpdatingId(profileId);
    const { error } = await supabase.from("profiles").update({ country: newCountry } as any).eq("id", profileId);
    setUpdatingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Country updated");
    refresh();
  };


  const rows = contactData?.rows || [];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-7 h-7 text-accent" />
          <div>
            <h1 className="text-3xl font-bold">Database</h1>
            <p className="text-sm text-muted-foreground mt-0.5">One central records store — every contact and platform account together</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={refresh}><RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /> Refresh</Button>
          <Button variant="outline" size="sm" onClick={exportAll}><Download size={14} /> Export CSV</Button>
          <Button size="sm" onClick={() => setUploadOpen(true)}><Upload size={14} /> Bulk Upload</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Database} label="Total records" value={(meta?.total ?? 0).toLocaleString()} />
        <StatCard icon={Globe} label="Countries" value={meta?.countries ?? 0} />
        <StatCard icon={Users} label="Platform accounts" value={(profiles?.length ?? 0).toLocaleString()} />
        <StatCard icon={ShieldCheck} label="Upgraded accounts" value={upgraded.length} />
      </div>

      {(meta?.countryList?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(meta?.countryList || []).slice(0, 12).map(([name, n]) => (
            <button key={name}
              onClick={() => { setCountryFilter(countryFilter.toLowerCase() === name.toLowerCase() ? "all" : name); setPage(0); }}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${countryFilter.toLowerCase() === name.toLowerCase() ? "bg-accent text-accent-foreground border-accent" : "border-border bg-card hover:border-accent/50"}`}>
              {name} <span className="opacity-70">{n.toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center mb-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, phone, country..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={view} onValueChange={(v) => { setView(v as ViewFilter); setPage(0); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All records</SelectItem>
            <SelectItem value="accounts">Platform accounts</SelectItem>
            <SelectItem value="upgraded">Upgraded (admins)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setPage(0); }}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All countries</SelectItem>
            <SelectItem value="none">No country set{meta?.unknown ? ` (${meta.unknown})` : ""}</SelectItem>
            {(meta?.countryList || []).map(([name, n]) => (
              <SelectItem key={name} value={name}>{name} ({n.toLocaleString()})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(0); }}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at.desc">Newest first</SelectItem>
            <SelectItem value="created_at.asc">Oldest first</SelectItem>
            <SelectItem value="first_name.asc">First name A–Z</SelectItem>
            <SelectItem value="first_name.desc">First name Z–A</SelectItem>
            <SelectItem value="last_name.asc">Last name A–Z</SelectItem>
            <SelectItem value="last_name.desc">Last name Z–A</SelectItem>
            <SelectItem value="email.asc">Email A–Z</SelectItem>
            <SelectItem value="country.asc">Country A–Z</SelectItem>
            <SelectItem value="country.desc">Country Z–A</SelectItem>
          </SelectContent>
        </Select>
        {(countryFilter !== "all" || sortBy !== "created_at.desc" || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCountryFilter("all"); setSortBy("created_at.desc"); setPage(0); }}>Clear</Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Record</Button>
        <Button size="sm" onClick={() => setAccountOpen(true)}><ShieldCheck size={14} /> New Upgraded Account</Button>

      </div>


      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          {isAccountView ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Ministry</TableHead>
                  <TableHead>Ministerial Role</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Signed up</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!pagedAccounts.length ? (
                  <TableRow><TableCell colSpan={12} className="text-center py-10 text-muted-foreground">No accounts found.</TableCell></TableRow>
                ) : pagedAccounts.map((p: any, i) => {
                  const isSelf = p.user_id === currentProfile?.user_id;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground text-xs">{page * PAGE_SIZE + i + 1}</TableCell>
                      <TableCell className="font-medium">{[p.title, p.full_name].filter(Boolean).join(" ") || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{p.email || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{p.phone || "—"}</TableCell>
                      <TableCell className="text-xs">{p.ministry_name || "—"}</TableCell>
                      <TableCell className="text-xs">{p.ministerial_role || "—"}</TableCell>
                      <TableCell className="text-xs">{p.city || "—"}</TableCell>
                      <TableCell>
                        <Select value={p.country || ""} onValueChange={(val) => changeCountry(p.id, val)} disabled={updatingId === p.id}>
                          <SelectTrigger className="w-40 h-8 text-xs">
                            <SelectValue placeholder="Set country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        {isProfileComplete(p)
                          ? <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">Complete</Badge>
                          : <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Incomplete</Badge>}
                      </TableCell>
                      <TableCell><Badge className={roleBadgeColor[p.role] || "bg-muted"}>{p.role}</Badge></TableCell>
                      <TableCell>
                        {isSelf ? <span className="text-xs text-muted-foreground">Can't change own role</span> : (
                          <Select value={p.role} onValueChange={(val) => changeRole(p.id, val)} disabled={updatingId === p.id}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>{roleOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Ministry</TableHead>
                  <TableHead>Ministerial Role</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={13} className="text-center py-10 text-muted-foreground">Loading records...</TableCell></TableRow>
                ) : !rows.length ? (
                  <TableRow><TableCell colSpan={13} className="text-center py-10 text-muted-foreground">No records found.</TableCell></TableRow>
                ) : rows.map((c, i) => {
                  const linked = profileByEmail.get((c.email || "").toLowerCase()) as any;
                  return (
                    <TableRow key={c.id} className="font-mono text-xs">
                      <TableCell className="text-muted-foreground">{page * PAGE_SIZE + i + 1}</TableCell>
                      <EditableCell value={c.title || linked?.title} onSave={v => saveField(c.id, "title", v)} />
                      <EditableCell value={c.first_name} onSave={v => saveField(c.id, "first_name", v)} className="font-medium font-sans" />
                      <EditableCell value={c.last_name} onSave={v => saveField(c.id, "last_name", v)} className="font-medium font-sans" />
                      <EditableCell value={c.email} onSave={v => saveField(c.id, "email", v.toLowerCase())} className="max-w-[220px] truncate" />
                      <EditableCell value={c.phone || linked?.phone} onSave={v => saveField(c.id, "phone", v)} />
                      <TableCell className="font-sans">{linked?.ministry_name || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="font-sans">{linked?.ministerial_role || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="font-sans">{linked?.city || <span className="text-muted-foreground">—</span>}</TableCell>
                      <EditableCell value={c.country || linked?.country} onSave={v => saveField(c.id, "country", v)} options={COUNTRIES} />
                      <TableCell className="font-sans text-muted-foreground">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</TableCell>

                      <TableCell>
                        {linked
                          ? <Badge className={`font-sans ${roleBadgeColor[linked.role] || "bg-muted"}`}>{linked.role}</Badge>
                          : <span className="text-muted-foreground">contact</span>}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeContact(c.id)}>
                          <Trash2 size={13} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

              </TableBody>
            </Table>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
          <span className="text-muted-foreground">
            {totalRows.toLocaleString()} rows · page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      </div>

      {/* Bulk upload */}
      <Dialog open={uploadOpen} onOpenChange={(o) => { if (!uploading) { setUploadOpen(o); if (!o) setPreview(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Records</DialogTitle>
            <DialogDescription>Upload a CSV or Excel file. Everything lands in the same database; existing emails are skipped.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadSample("csv")}><FileSpreadsheet size={14} /> Sample CSV</Button>
              <Button variant="outline" size="sm" onClick={() => downloadSample("xlsx")}><FileSpreadsheet size={14} /> Sample XLSX</Button>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              Accepted columns: <span className="font-mono">{COLUMNS.join(", ")}</span>. Headerless files in that order also work.
            </div>

            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-accent transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            >
              <Upload className="mx-auto mb-2 text-muted-foreground" size={22} />
              <p className="text-sm">Click or drop a .csv / .xlsx file here</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
            </div>

            {preview && (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-3 py-2 text-xs bg-muted/40 border-b border-border">{preview.length} rows ready · showing first 5</div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>{COLUMNS.map(c => <TableHead key={c} className="text-[11px]">{c}</TableHead>)}</TableRow></TableHeader>
                    <TableBody>
                      {preview.slice(0, 5).map((r, i) => (
                        <TableRow key={i} className="text-xs font-mono">
                          {COLUMNS.map(c => <TableCell key={c} className="max-w-[140px] truncate">{r[c] || "—"}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {uploading && <Progress value={progress} />}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setPreview(null); setUploadOpen(false); }} disabled={uploading}>Cancel</Button>
            <Button onClick={runImport} disabled={!preview || uploading}>{uploading ? `Importing ${progress}%` : "Import Records"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add single record */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Record</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {COLUMNS.map(c => (
              <div key={c} className={c === "email" ? "col-span-2" : ""}>
                <Label className="text-xs capitalize">{c.replace("_", " ")}</Label>
                <Input className="mt-1" value={newContact[c] || ""} onChange={(e) => setNewContact(p => ({ ...p, [c]: e.target.value }))} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addContact}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New upgraded account */}
      <Dialog open={accountOpen} onOpenChange={(o) => { if (!savingAccount) setAccountOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Upgraded Account</DialogTitle>
            <DialogDescription>
              Create an admin account, or enter an existing member's email to upgrade their role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Email</Label>
              <Input className="mt-1" type="email" value={newAccount.email}
                onChange={(e) => setNewAccount(p => ({ ...p, email: e.target.value }))} placeholder="name@example.com" />
              {profileByEmail.has(newAccount.email.trim().toLowerCase()) && (
                <p className="text-[11px] text-accent mt-1">This member already has an account — their role will be upgraded.</p>
              )}
            </div>
            <div>
              <Label className="text-xs">Full name</Label>
              <Input className="mt-1" value={newAccount.full_name}
                onChange={(e) => setNewAccount(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Country</Label>
              <Select value={newAccount.country} onValueChange={(v) => setNewAccount(p => ({ ...p, country: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {!profileByEmail.has(newAccount.email.trim().toLowerCase()) && (
              <div>
                <Label className="text-xs">Temporary password</Label>
                <Input className="mt-1" type="text" value={newAccount.password}
                  onChange={(e) => setNewAccount(p => ({ ...p, password: e.target.value }))} placeholder="min. 8 characters" />
              </div>
            )}
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={newAccount.role} onValueChange={(v) => setNewAccount(p => ({ ...p, role: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{roleOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountOpen(false)} disabled={savingAccount}>Cancel</Button>
            <Button onClick={createAccount} disabled={savingAccount}>{savingAccount ? "Saving..." : "Save Account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
