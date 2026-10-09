import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, getStoredPin } from "@/hooks/useBookstoreAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Database, RefreshCw, Plus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface ContactRow {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  source: string | null;
  group_name: string | null;
}

const contactName = (contact: ContactRow) =>
  [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();

const SOURCE_LABELS: Record<string, string> = {
  bulk_upload: "Uploaded Database",
  platform_signup: "Platform Sign-ups",
};

const titleCase = (v: string) =>
  v.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());

export function DispatchContactCategories({
  onAddEmails,
  selectedEmails,
}: {
  onAddEmails: (emails: string[]) => void;
  selectedEmails: string[];
}) {
  const isPublic = isPublicDashboard();
  const getPin = () =>
    isPublic ? getStoredPin() || "" : sessionStorage.getItem("dashboard_pin") || "2323";

  const [search, setSearch] = useState("");

  const { data: contacts = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dispatch-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-dispatch-email", {
        body: { pin: getPin(), action: "get_contacts" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data.contacts || []) as ContactRow[];
    },
  });

  const emails = useMemo(
    () =>
      contacts
        .map((c) => (c.email || "").toLowerCase().trim())
        .filter((e) => e.includes("@")),
    [contacts]
  );

  const buildGroups = (keyFn: (c: ContactRow) => string) => {
    const map = new Map<string, string[]>();
    contacts.forEach((c) => {
      const email = (c.email || "").toLowerCase().trim();
      if (!email.includes("@")) return;
      const key = keyFn(c);
      const arr = map.get(key) || [];
      if (!arr.includes(email)) arr.push(email);
      map.set(key, arr);
    });
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  };

  const bySource = useMemo(
    () => buildGroups((c) => SOURCE_LABELS[c.source || ""] || titleCase(c.source || "Other")),
    [contacts]
  );

  const byCountry = useMemo(
    () => buildGroups((c) => (c.country?.trim() ? titleCase(c.country.trim()) : "Unspecified")),
    [contacts]
  );

  const byLetter = useMemo(
    () =>
      buildGroups((c) => {
        const name = (c.first_name || c.email || "").trim();
        const ch = name.charAt(0).toUpperCase();
        return /[A-Z]/.test(ch) ? ch : "#";
      }).sort((a, b) => a[0].localeCompare(b[0])),
    [contacts]
  );

  const add = (label: string, list: string[]) => {
    const fresh = list.filter((e) => !selectedEmails.includes(e));
    if (!fresh.length) {
      toast.info(`All ${label} contacts are already added`);
      return;
    }
    onAddEmails(fresh);
    toast.success(`Added ${fresh.length} recipient${fresh.length !== 1 ? "s" : ""} from ${label}`);
  };

  const renderGroups = (groups: [string, string[]][]) => {
    const filtered = search.trim()
      ? groups.filter(([k]) => k.toLowerCase().includes(search.toLowerCase().trim()))
      : groups;
    if (!filtered.length)
      return <p className="text-sm text-muted-foreground py-3">No categories match.</p>;
    return (
      <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
        {filtered.map(([label, list]) => {
          const added = list.filter((e) => selectedEmails.includes(e)).length;
          return (
            <div
              key={label}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {list.length.toLocaleString()} contact{list.length !== 1 ? "s" : ""}
                  {added > 0 && ` · ${added.toLocaleString()} added`}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 text-xs"
                onClick={() => add(label, list)}
              >
                <Plus size={12} className="mr-1" /> Add
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((contact) =>
      [contactName(contact), contact.email, contact.country, contact.group_name]
        .some((value) => (value || "").toLowerCase().includes(term))
    );
  }, [contacts, search]);

  const renderRecords = () => {
    if (!filteredRecords.length) {
      return <p className="text-sm text-muted-foreground py-3">No database records match.</p>;
    }
    return (
      <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
        {filteredRecords.map((contact, index) => {
          const email = (contact.email || "").toLowerCase().trim();
          if (!email.includes("@")) return null;
          const added = selectedEmails.includes(email);
          const name = contactName(contact);
          return (
            <div key={`${email}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{name || email}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {name ? email : [contact.country, contact.group_name].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 text-xs"
                disabled={added}
                onClick={() => add(name || email, [email])}
              >
                <Plus size={12} className="mr-1" /> {added ? "Added" : "Add"}
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Database className="w-5 h-5 text-accent" /> Database Contacts
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading database...
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
              <div>
                <p className="text-xl font-bold leading-none">{emails.length.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Total mailable records</p>
              </div>
              <Badge variant="secondary" className="text-[11px]">
                {byCountry.length} countries
              </Badge>
            </div>

            <Button
              size="sm"
              className="w-full"
              variant="outline"
              onClick={() => add("the full database", emails)}
            >
              <Plus size={14} className="mr-1" /> Add all {emails.length.toLocaleString()}
            </Button>

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search names, emails, countries..."
                className="pl-8 h-9 text-sm"
              />
            </div>

            <Tabs defaultValue="records">
              <TabsList className="grid grid-cols-4 w-full h-8">
                <TabsTrigger value="records" className="text-xs">Records</TabsTrigger>
                <TabsTrigger value="source" className="text-xs">Source</TabsTrigger>
                <TabsTrigger value="country" className="text-xs">Country</TabsTrigger>
                <TabsTrigger value="letter" className="text-xs">A–Z</TabsTrigger>
              </TabsList>
              <TabsContent value="records" className="mt-3">{renderRecords()}</TabsContent>
              <TabsContent value="source" className="mt-3">{renderGroups(bySource)}</TabsContent>
              <TabsContent value="country" className="mt-3">{renderGroups(byCountry)}</TabsContent>
              <TabsContent value="letter" className="mt-3">{renderGroups(byLetter)}</TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
