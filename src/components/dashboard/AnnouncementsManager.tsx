import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Plus, Pencil, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { getStoredPin, adminQuery, adminInsert, adminUpdate, adminDelete } from "@/hooks/useBookstoreAdmin";

// Session tokens can expire while the dashboard stays open, which surfaces as
// "JWT expired" / RLS errors. Refresh once, then fall back to the PIN-backed
// admin service so admins never lose their work.
const isAuthIssue = (e: any) => {
  const m = String(e?.message || e || "").toLowerCase();
  return m.includes("jwt") || m.includes("token") || m.includes("row-level") ||
    m.includes("row level") || m.includes("permission") || m.includes("401") || m.includes("403");
};

async function withAuthFallback<T>(direct: () => Promise<T>, viaAdmin: () => Promise<T>): Promise<T> {
  try {
    return await direct();
  } catch (e) {
    if (!isAuthIssue(e)) throw e;
    try {
      const { data } = await supabase.auth.refreshSession();
      if (data?.session) return await direct();
    } catch { /* fall through */ }
    if (getStoredPin()) return await viaAdmin();
    throw new Error("Your admin session expired. Please refresh the page and sign in again.");
  }
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  category: string;
  published_at: string;
  is_active: boolean;
  archived: boolean;
}

const emptyForm = { title: "", body: "", image_url: "", category: "general", is_active: true };

export function AnnouncementsManager() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["announcements-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["announcements-admin"] });
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    queryClient.invalidateQueries({ queryKey: ["archived-announcements"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const payload = {
        title: values.title.trim(),
        body: values.body.trim(),
        image_url: values.image_url.trim() || null,
        category: values.category.trim() || "general",
        is_active: values.is_active,
      };
      if (values.id) {
        const { error } = await supabase.from("announcements").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("announcements").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Announcement updated" : "Announcement published");
      close();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Announcement> }) => {
      const { error } = await supabase.from("announcements").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Announcement deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const close = () => { setOpen(false); setEditing(null); setForm(emptyForm); };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, body: a.body, image_url: a.image_url ?? "", category: a.category, is_active: a.is_active });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return toast.error("Title and body are required");
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  const live = useMemo(() => items.filter((a) => !a.archived), [items]);
  const archived = useMemo(() => items.filter((a) => a.archived), [items]);

  const List = ({ rows }: { rows: Announcement[] }) => (
    rows.length === 0 ? (
      <div className="text-center py-12 text-muted-foreground">Nothing here yet.</div>
    ) : (
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {rows.map((a) => (
          <div key={a.id} className={`px-4 py-3 flex items-start gap-3 ${!a.is_active ? "opacity-60" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{a.title}</p>
                <Badge variant="secondary" className="text-[10px] capitalize">{a.category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.published_at).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.body}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!a.archived && (
                <Switch checked={a.is_active} onCheckedChange={(v) => patchMutation.mutate({ id: a.id, patch: { is_active: v } })} />
              )}
              <Button
                variant="ghost" size="icon" className="h-8 w-8"
                title={a.archived ? "Restore" : "Archive"}
                onClick={() => patchMutation.mutate({ id: a.id, patch: { archived: !a.archived } })}
              >
                {a.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(a)}>
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete"
                onClick={() => { if (confirm("Delete this announcement?")) deleteMutation.mutate(a.id); }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-accent" /> Announcements
        </h1>
        <Button size="sm" onClick={openCreate}><Plus size={16} className="mr-1" /> New</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <Tabs defaultValue="live">
          <TabsList className="mb-4">
            <TabsTrigger value="live">Live ({live.length})</TabsTrigger>
            <TabsTrigger value="archived">Archive ({archived.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="live"><List rows={live} /></TabsContent>
          <TabsContent value="archived"><List rows={archived} /></TabsContent>
        </Tabs>
      )}

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "New"} Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} maxLength={60} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="general" />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea rows={6} value={form.body} maxLength={5000} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Publish"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
