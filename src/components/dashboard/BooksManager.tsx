import { useState } from "react";
import { useBooks, useCategories, Book } from "@/hooks/useBooks";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BookForm {
  title: string;
  author: string;
  description: string;
  price: string;
  stock: string;
  pages: string;
  isbn: string;
  cover_image_url: string;
  cloudpdf_document_id: string;
  category_id: string;
  is_digital: boolean;
  is_physical: boolean;
  featured: boolean;
}

const emptyForm: BookForm = {
  title: "", author: "", description: "", price: "0", stock: "0", pages: "",
  isbn: "", cover_image_url: "", cloudpdf_document_id: "", category_id: "", is_digital: false, is_physical: true, featured: false,
};

export function BooksManager() {
  const { data: books, isLoading } = useBooks();
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BookForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setCoverFile(null); setOpen(true); };

  const openEdit = (book: Book) => {
    setForm({
      title: book.title, author: book.author, description: book.description || "",
      price: String(book.price), stock: String(book.stock), pages: book.pages ? String(book.pages) : "",
      isbn: book.isbn || "", cover_image_url: book.cover_image_url || "",
      cloudpdf_document_id: book.cloudpdf_document_id || "",
      category_id: book.category_id || "", is_digital: book.is_digital,
      is_physical: book.is_physical, featured: book.featured,
    });
    setEditingId(book.id);
    setCoverFile(null);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.author) { toast.error("Title and author are required"); return; }
    setSaving(true);
    try {
      let coverUrl = form.cover_image_url;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("book-covers").upload(path, coverFile);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from("book-covers").getPublicUrl(path);
        coverUrl = publicUrl;
      }

      const record = {
        title: form.title, author: form.author, description: form.description || null,
        price: parseFloat(form.price) || 0, stock: parseInt(form.stock) || 0,
        pages: form.pages ? parseInt(form.pages) : null, isbn: form.isbn || null,
        cover_image_url: coverUrl || null, cloudpdf_document_id: form.cloudpdf_document_id || null,
        category_id: form.category_id || null,
        is_digital: form.is_digital, is_physical: form.is_physical, featured: form.featured,
      };

      if (editingId) {
        const { error, data } = await supabase.from("books").update(record).eq("id", editingId).select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Update blocked — you must be logged in as an admin.");
        toast.success("Book updated");
      } else {
        const { error } = await supabase.from("books").insert(record).select("id");
        if (error) throw error;
        toast.success("Book created");
      }
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    const { error, data } = await supabase.from("books").delete().eq("id", id).select("id");
    if (error) { toast.error(error.message); return; }
    if (!data || data.length === 0) { toast.error("Delete blocked — you must be logged in as an admin."); return; }
    toast.success("Book deleted");
    queryClient.invalidateQueries({ queryKey: ["books"] });
  };

  const set = (key: keyof BookForm, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Books</h1>
        <Button onClick={openNew} className="gap-2"><Plus size={16} /> Add Book</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cover</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books?.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt="" className="w-10 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-14 bg-muted rounded" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>${book.price}</TableCell>
                  <TableCell>{book.stock}</TableCell>
                  <TableCell>{book.featured ? "⭐" : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(book)}><Pencil size={15} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(book.id)} className="text-destructive"><Trash2 size={15} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Book" : "Add Book"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
              <div><Label>Author *</Label><Input value={form.author} onChange={e => set("author", e.target.value)} /></div>
            </div>
            <div><Label>Description</Label><textarea className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={form.description} onChange={e => set("description", e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} /></div>
              <div><Label>Pages</Label><Input type="number" value={form.pages} onChange={e => set("pages", e.target.value)} /></div>
            </div>
            <div><Label>ISBN</Label><Input value={form.isbn} onChange={e => set("isbn", e.target.value)} /></div>
            <div><Label>CloudPDF Document ID</Label><Input value={form.cloudpdf_document_id} onChange={e => set("cloudpdf_document_id", e.target.value)} placeholder="e.g. dfbd936c-2956-41a3-9e98-233ac431dd13" /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={v => set("category_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cover Image</Label>
              <Input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="mt-1" />
              {form.cover_image_url && !coverFile && (
                <img src={form.cover_image_url} alt="" className="mt-2 h-20 rounded" />
              )}
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_physical} onCheckedChange={v => set("is_physical", v)} /> Physical</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_digital} onCheckedChange={v => set("is_digital", v)} /> Digital</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.featured} onCheckedChange={v => set("featured", v)} /> Featured</label>
            </div>
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
