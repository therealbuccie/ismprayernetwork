import { useState } from "react";
import { CoverUpload } from "@/components/dashboard/CoverUpload";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, adminQuery, adminInsert, adminUpdate, adminDelete } from "@/hooks/useBookstoreAdmin";
import { useBooks } from "@/hooks/useBooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

interface ComboPack {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  price: number;
  espees_price: number | null;
  ngn_price: number | null;
  featured: boolean;
  is_active: boolean;
  created_at: string;
}

interface ComboPackItem {
  id: string;
  combo_pack_id: string;
  book_id: string;
}

export function ComboPacksManager() {
  const isPublic = isPublicDashboard();
  const queryClient = useQueryClient();
  const { data: books } = useBooks();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ComboPack | null>(null);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    short_description: "",
    cover_image_url: "",
    price: 0,
    espees_price: 0,
    ngn_price: 0,
    featured: false,
    is_active: true,
  });

  const { data: combos, isLoading } = useQuery({
    queryKey: ["combo-packs"],
    queryFn: async () => {
      if (isPublic) return adminQuery("combo_packs", "*", undefined, [{ column: "created_at", ascending: false }]);
      const { data, error } = await supabase.from("combo_packs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: comboItems } = useQuery({
    queryKey: ["combo-pack-items"],
    queryFn: async () => {
      if (isPublic) return adminQuery("combo_pack_items", "*");
      const { data, error } = await supabase.from("combo_pack_items").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getBookIdsForCombo = (comboId: string) =>
    (comboItems as ComboPackItem[] | undefined)?.filter((i) => i.combo_pack_id === comboId).map((i) => i.book_id) ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", short_description: "", cover_image_url: "", price: 0, espees_price: 0, ngn_price: 0, featured: false, is_active: true });
    setSelectedBookIds([]);
    setModalOpen(true);
  };

  const openEdit = (combo: ComboPack) => {
    setEditing(combo);
    setForm({
      title: combo.title,
      description: combo.description || "",
      short_description: combo.short_description || "",
      cover_image_url: combo.cover_image_url || "",
      price: combo.price,
      espees_price: combo.espees_price || 0,
      ngn_price: combo.ngn_price || 0,
      featured: combo.featured,
      is_active: combo.is_active,
    });
    setSelectedBookIds(getBookIdsForCombo(combo.id));
    setModalOpen(true);
  };

  const toggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleSave = async () => {
    if (!form.title.trim() || selectedBookIds.length < 2) {
      toast.error("Title and at least 2 books are required");
      return;
    }

    try {
      let comboId: string;

      if (editing) {
        if (isPublic) {
          await adminUpdate("combo_packs", { id: editing.id, ...form });
        } else {
          const { error } = await supabase.from("combo_packs").update(form).eq("id", editing.id);
          if (error) throw error;
        }
        comboId = editing.id;

        // Delete old items then re-insert
        const existingItems = getBookIdsForCombo(comboId);
        for (const bookId of existingItems) {
          const item = (comboItems as ComboPackItem[])?.find((i) => i.combo_pack_id === comboId && i.book_id === bookId);
          if (item) {
            if (isPublic) await adminDelete("combo_pack_items", item.id);
            else await supabase.from("combo_pack_items").delete().eq("id", item.id);
          }
        }
      } else {
        let result: any;
        if (isPublic) {
          result = await adminInsert("combo_packs", form);
        } else {
          const { data, error } = await supabase.from("combo_packs").insert(form).select().single();
          if (error) throw error;
          result = data;
        }
        comboId = result.id;
      }

      // Insert book items
      for (const bookId of selectedBookIds) {
        if (isPublic) {
          await adminInsert("combo_pack_items", { combo_pack_id: comboId, book_id: bookId });
        } else {
          await supabase.from("combo_pack_items").insert({ combo_pack_id: comboId, book_id: bookId });
        }
      }

      toast.success(editing ? "Combo pack updated!" : "Combo pack created!");
      queryClient.invalidateQueries({ queryKey: ["combo-packs"] });
      queryClient.invalidateQueries({ queryKey: ["combo-pack-items"] });
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this combo pack?")) return;
    try {
      if (isPublic) await adminDelete("combo_packs", id);
      else {
        const { error } = await supabase.from("combo_packs").delete().eq("id", id);
        if (error) throw error;
      }
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["combo-packs"] });
      queryClient.invalidateQueries({ queryKey: ["combo-pack-items"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const individualTotal = selectedBookIds.reduce((sum, id) => {
    const book = books?.find((b) => b.id === id);
    return sum + (book?.price || 0);
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Package size={28} /> Combo Packs</h1>
        <Button onClick={openCreate} className="gap-2"><Plus size={16} /> New Combo</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Books</TableHead>
                <TableHead>Price (USD)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(combos as ComboPack[] | undefined)?.map((combo) => (
                <TableRow key={combo.id}>
                  <TableCell className="font-medium">{combo.title}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {getBookIdsForCombo(combo.id).length} books
                    </span>
                  </TableCell>
                  <TableCell>${Number(combo.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={combo.is_active ? "default" : "secondary"}>
                      {combo.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(combo)}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(combo.id)} className="text-destructive">
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!combos || (combos as any[]).length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No combo packs yet. Create one to bundle books together.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Combo Pack" : "Create Combo Pack"}</DialogTitle>
            <DialogDescription>
              Bundle multiple books together at a discounted price.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Prayer Starter Bundle" />
            </div>

            <div>
              <label className="text-sm font-medium">Short Description</label>
              <Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="Brief tagline for cards" />
            </div>

            <div>
              <label className="text-sm font-medium">Full Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Detailed description for the detail view" />
            </div>

            <div>
              <label className="text-sm font-medium">Cover Image</label>
              <div className="mt-1">
                <CoverUpload
                  currentUrl={form.cover_image_url}
                  onUploaded={(url) => setForm({ ...form, cover_image_url: url })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">USD Price</label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-sm font-medium">ESPEES Price</label>
                <Input type="number" step="0.01" value={form.espees_price} onChange={(e) => setForm({ ...form, espees_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-sm font-medium">NGN Price</label>
                <Input type="number" step="0.01" value={form.ngn_price} onChange={(e) => setForm({ ...form, ngn_price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>

            {individualTotal > 0 && (
              <p className="text-sm text-muted-foreground">
                Individual total: <span className="font-semibold">${individualTotal.toFixed(2)}</span>
                {form.price > 0 && (
                  <> → Savings: <span className="text-green-500 font-semibold">${(individualTotal - form.price).toFixed(2)} ({Math.round(((individualTotal - form.price) / individualTotal) * 100)}% off)</span></>
                )}
              </p>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                <label className="text-sm">Featured</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <label className="text-sm">Active</label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Books ({selectedBookIds.length} selected — minimum 2)
              </label>
              <div className="max-h-60 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                {books?.map((book) => (
                  <label
                    key={book.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedBookIds.includes(book.id)}
                      onCheckedChange={() => toggleBook(book.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground">${Number(book.price).toFixed(2)}</p>
                    </div>
                    {book.cover_image_url && (
                      <img src={book.cover_image_url} alt="" className="w-8 h-10 rounded object-cover" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={!form.title.trim() || selectedBookIds.length < 2}>
              {editing ? "Update Combo Pack" : "Create Combo Pack"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
