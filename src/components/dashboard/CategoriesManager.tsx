import { useState } from "react";
import { useCategories, Category } from "@/hooks/useBooks";
import { supabase } from "@/integrations/supabase/client";
import { isPublicBookstoreDashboard, bookstoreAdminCall } from "@/hooks/useBookstoreAdmin";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function CategoriesManager() {
  const { data: categories, isLoading } = useCategories();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const openNew = () => { setName(""); setEditingId(null); setOpen(true); };
  const openEdit = (cat: Category) => { setName(cat.name); setEditingId(cat.id); setOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const isPublic = isPublicBookstoreDashboard();
      if (editingId) {
        if (isPublic) {
          await bookstoreAdminCall("update_category", { id: editingId, name: name.trim() });
        } else {
          const { error } = await supabase.from("categories").update({ name: name.trim() }).eq("id", editingId);
          if (error) throw error;
        }
        toast.success("Category updated");
      } else {
        if (isPublic) {
          await bookstoreAdminCall("insert_category", { name: name.trim() });
        } else {
          const { error } = await supabase.from("categories").insert({ name: name.trim() });
          if (error) throw error;
        }
        toast.success("Category created");
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      if (isPublicBookstoreDashboard()) {
        await bookstoreAdminCall("delete_category", { id });
      } else {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) throw error;
      }
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Button onClick={openNew} className="gap-2"><Plus size={16} /> Add Category</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil size={15} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-destructive"><Trash2 size={15} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="Category name" value={name} onChange={e => setName(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
