import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, adminQuery, adminInsert, adminUpdate, adminDelete } from "@/hooks/useBookstoreAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

interface ProgramForm {
  title: string; description: string; location: string; event_date: string; image_url: string; video_url: string; is_upcoming: boolean;
}
const emptyForm: ProgramForm = { title: "", description: "", location: "", event_date: "", image_url: "", video_url: "", is_upcoming: true };

export function ProgramsManager() {
  const queryClient = useQueryClient();
  const isPublic = isPublicDashboard();

  const { data: programs, isLoading } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: async () => {
      if (isPublic) return adminQuery("programs", "*", undefined, [{ column: "created_at", ascending: false }]);
      const { data, error } = await supabase.from("programs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setOpen(true); };
  const openEdit = (p: any) => {
    setForm({
      title: p.title, description: p.description || "", location: p.location || "",
      event_date: p.event_date ? new Date(p.event_date).toISOString().slice(0, 16) : "",
      image_url: p.image_url || "", video_url: p.video_url || "", is_upcoming: p.is_upcoming,
    });
    setEditingId(p.id); setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const record: any = {
        title: form.title, description: form.description || null,
        location: form.location || null, event_date: form.event_date || null,
        image_url: form.image_url || null, is_upcoming: form.is_upcoming,
      };
      if (editingId) {
        if (isPublic) await adminUpdate("programs", { id: editingId, ...record });
        else { const { error } = await supabase.from("programs").update(record).eq("id", editingId); if (error) throw error; }
        toast.success("Program updated");
      } else {
        if (isPublic) await adminInsert("programs", record);
        else { const { error } = await supabase.from("programs").insert(record); if (error) throw error; }
        toast.success("Program created");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
      setOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    try {
      if (isPublic) await adminDelete("programs", id);
      else { const { error } = await supabase.from("programs").delete().eq("id", id); if (error) throw error; }
      toast.success("Program deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
    } catch (err: any) { toast.error(err.message); }
  };

  const set = (key: keyof ProgramForm, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-accent" />
          <h1 className="text-3xl font-bold">Programs</h1>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus size={16} /> Add Program</Button>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Location</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {programs?.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{p.location || "—"}</TableCell>
                  <TableCell>{p.event_date ? new Date(p.event_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell><Badge className={p.is_upcoming ? "bg-green-500/20 text-green-700" : "bg-muted text-muted-foreground"}>{p.is_upcoming ? "Upcoming" : "Past"}</Badge></TableCell>
                  <TableCell className="text-right"><div className="flex items-center justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil size={15} /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive"><Trash2 size={15} /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Program" : "Add Program"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
            <div><Label>Description</Label><textarea className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={form.description} onChange={e => set("description", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Location</Label><Input value={form.location} onChange={e => set("location", e.target.value)} /></div>
              <div><Label>Event Date</Label><Input type="datetime-local" value={form.event_date} onChange={e => set("event_date", e.target.value)} /></div>
            </div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => set("image_url", e.target.value)} /></div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_upcoming} onCheckedChange={v => set("is_upcoming", v)} /> Upcoming</label>
            <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
