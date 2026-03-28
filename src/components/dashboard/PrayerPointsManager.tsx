import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
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

  // Group by category for display
  const categories = [...new Set(points.map(p => p.category))];

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
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(point)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
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
    </div>
  );
}
