import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, CalendarHeart } from "lucide-react";
import { toast } from "sonner";

interface EventForm {
  minister_name: string;
  birthday_day: string;
  birthday_month: string;
  description: string;
  minister_image_url: string;
}

const emptyForm: EventForm = {
  minister_name: "", birthday_day: "", birthday_month: "", description: "", minister_image_url: "",
};

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function EventsManager() {
  const queryClient = useQueryClient();
  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("birthday_month").order("birthday_day");
      if (error) throw error;
      return data;
    },
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setOpen(true); };
  const openEdit = (e: any) => {
    setForm({
      minister_name: e.minister_name, birthday_day: String(e.birthday_day),
      birthday_month: String(e.birthday_month), description: e.description || "",
      minister_image_url: e.minister_image_url || "",
    });
    setEditingId(e.id); setOpen(true);
  };

  const handleSave = async () => {
    if (!form.minister_name || !form.birthday_day || !form.birthday_month) {
      toast.error("Name, day, and month are required"); return;
    }
    setSaving(true);
    try {
      const record = {
        minister_name: form.minister_name,
        birthday_day: parseInt(form.birthday_day),
        birthday_month: parseInt(form.birthday_month),
        description: form.description || null,
        minister_image_url: form.minister_image_url || null,
      };
      if (editingId) {
        const { error } = await supabase.from("events").update(record).eq("id", editingId);
        if (error) throw error;
        toast.success("Event updated");
      } else {
        const { error } = await supabase.from("events").insert(record);
        if (error) throw error;
        toast.success("Event created");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      setOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Event deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-events"] });
  };

  const set = (key: keyof EventForm, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarHeart className="w-6 h-6 text-accent" />
          <h1 className="text-3xl font-bold">Events</h1>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus size={16} /> Add Event</Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Minister</TableHead>
                <TableHead>Birthday</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.minister_name}</TableCell>
                  <TableCell>{months[e.birthday_month - 1]} {e.birthday_day}</TableCell>
                  <TableCell className="max-w-xs truncate">{e.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil size={15} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-destructive"><Trash2 size={15} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Event" : "Add Event"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Minister Name *</Label><Input value={form.minister_name} onChange={e => set("minister_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Birthday Month *</Label><Input type="number" min={1} max={12} value={form.birthday_month} onChange={e => set("birthday_month", e.target.value)} placeholder="1-12" /></div>
              <div><Label>Birthday Day *</Label><Input type="number" min={1} max={31} value={form.birthday_day} onChange={e => set("birthday_day", e.target.value)} placeholder="1-31" /></div>
            </div>
            <div><Label>Description</Label><textarea className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={form.description} onChange={e => set("description", e.target.value)} /></div>
            <div><Label>Image URL</Label><Input value={form.minister_image_url} onChange={e => set("minister_image_url", e.target.value)} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
