import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Plus, Pencil, Trash2, GripVertical, Copy, Send, Search } from "lucide-react";
import { toast } from "sonner";

interface PrayerPoint {
  id: string;
  category: string;
  title: string;
  scripture: string;
  body: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = { category: "", title: "", scripture: "", body: "", sort_order: 0, is_active: true };

export function PrayerPointsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PrayerPoint | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Send-to-groups dialog state
  const [sendOpen, setSendOpen] = useState(false);
  const [sendingPoint, setSendingPoint] = useState<PrayerPoint | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [groupSearch, setGroupSearch] = useState("");

  const { data: points = [], isLoading } = useQuery({
    queryKey: ["prayer-points-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_points")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as PrayerPoint[];
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["prayer-groups-for-send"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_groups")
        .select("id, name, member_count")
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string; member_count: number }[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      if (values.id) {
        const { error } = await supabase.from("prayer_points").update({
          category: values.category,
          title: values.title,
          scripture: values.scripture,
          body: values.body,
          sort_order: values.sort_order,
          is_active: values.is_active,
          updated_at: new Date().toISOString(),
        }).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("prayer_points").insert({
          category: values.category,
          title: values.title,
          scripture: values.scripture,
          body: values.body,
          sort_order: values.sort_order,
          is_active: values.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-points-admin"] });
      queryClient.invalidateQueries({ queryKey: ["prayer-points"] });
      toast.success(editing ? "Prayer point updated" : "Prayer point added");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (p: PrayerPoint) => {
      const { error } = await supabase.from("prayer_points").insert({
        category: p.category,
        title: `${p.title} (Copy)`,
        scripture: p.scripture,
        body: p.body,
        sort_order: p.sort_order + 1,
        is_active: p.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-points-admin"] });
      queryClient.invalidateQueries({ queryKey: ["prayer-points"] });
      toast.success("Prayer point duplicated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prayer_points").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-points-admin"] });
      queryClient.invalidateQueries({ queryKey: ["prayer-points"] });
      toast.success("Prayer point deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("prayer_points").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-points-admin"] });
      queryClient.invalidateQueries({ queryKey: ["prayer-points"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!sendingPoint || selectedGroups.size === 0) throw new Error("Pick at least one group");
      const { data: userData } = await supabase.auth.getUser();
      const rows = Array.from(selectedGroups).map(gid => ({
        group_id: gid,
        prayer_point_id: sendingPoint.id,
        sent_by: userData.user?.id ?? null,
      }));
      const { error } = await supabase
        .from("group_prayer_assignments")
        .upsert(rows, { onConflict: "group_id,prayer_point_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Sent to ${selectedGroups.size} group${selectedGroups.size === 1 ? "" : "s"}`);
      setSendOpen(false);
      setSendingPoint(null);
      setSelectedGroups(new Set());
      setGroupSearch("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: points.length });
    setDialogOpen(true);
  };

  const openEdit = (p: PrayerPoint) => {
    setEditing(p);
    setForm({ category: p.category, title: p.title, scripture: p.scripture, body: p.body, sort_order: p.sort_order, is_active: p.is_active });
    setDialogOpen(true);
  };

  const openSend = (p: PrayerPoint) => {
    setSendingPoint(p);
    setSelectedGroups(new Set());
    setGroupSearch("");
    setSendOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category.trim() || !form.title.trim()) {
      toast.error("Category and title are required");
      return;
    }
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  const categories = [...new Set(points.map(p => p.category))];

  const filteredGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g => g.name.toLowerCase().includes(q));
  }, [groups, groupSearch]);

  const toggleGroup = (id: string) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      filteredGroups.forEach(g => next.add(g.id));
      return next;
    });
  };
  const clearAll = () => setSelectedGroups(new Set());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-accent" /> Prayer Points
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} size="sm">
              <Plus size={16} className="mr-1" /> Add Point
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Prayer Point</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Healing Streams"
                  list="pp-categories"
                />
                <datalist id="pp-categories">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="PRAY FOR..."
                />
              </div>
              <div>
                <Label>Scripture</Label>
                <Textarea
                  value={form.scripture}
                  onChange={e => setForm(f => ({ ...f, scripture: e.target.value }))}
                  placeholder="Romans 10:18 - ..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Body / Prayer Direction</Label>
                <Textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Pray that..."
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <Label>Active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : points.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No prayer points yet. Add one above.</div>
      ) : (
        <div className="space-y-6">
          {categories.map(cat => (
            <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <h3 className="font-semibold text-sm">{cat}</h3>
              </div>
              <div className="divide-y divide-border">
                {points.filter(p => p.category === cat).map(point => (
                  <div key={point.id} className={`px-4 py-3 flex items-start gap-3 ${!point.is_active ? "opacity-50" : ""}`}>
                    <GripVertical size={16} className="text-muted-foreground mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-snug">{point.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">{point.scripture}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{point.body}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch
                        checked={point.is_active}
                        onCheckedChange={v => toggleMutation.mutate({ id: point.id, is_active: v })}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Send to groups" onClick={() => openSend(point)}>
                        <Send size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicate" onClick={() => duplicateMutation.mutate(point)}>
                        <Copy size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(point)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete"
                        onClick={() => { if (confirm("Delete this prayer point?")) deleteMutation.mutate(point.id); }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send-to-Groups Dialog */}
      <Dialog open={sendOpen} onOpenChange={(o) => { setSendOpen(o); if (!o) { setSendingPoint(null); setSelectedGroups(new Set()); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Send to Prayer Groups</DialogTitle>
          </DialogHeader>
          {sendingPoint && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{sendingPoint.title}</p>
              <p className="text-xs text-muted-foreground italic mt-0.5 line-clamp-2">{sendingPoint.scripture}</p>
            </div>
          )}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={groupSearch}
              onChange={e => setGroupSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{selectedGroups.size} selected</span>
            <div className="flex gap-2">
              <button type="button" onClick={selectAllVisible} className="hover:text-foreground underline">Select visible</button>
              <button type="button" onClick={clearAll} className="hover:text-foreground underline">Clear</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto rounded-md border border-border divide-y divide-border">
            {filteredGroups.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No groups found</p>
            ) : filteredGroups.map(g => (
              <label key={g.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
                <Checkbox
                  checked={selectedGroups.has(g.id)}
                  onCheckedChange={() => toggleGroup(g.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.member_count} members</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending || selectedGroups.size === 0}
              className="gap-2"
            >
              <Send size={14} />
              {sendMutation.isPending ? "Sending..." : `Send to ${selectedGroups.size} group${selectedGroups.size === 1 ? "" : "s"}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
