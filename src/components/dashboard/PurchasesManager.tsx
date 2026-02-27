import { useState } from "react";
import { useAllPurchases } from "@/hooks/usePurchases";
import { useBooks } from "@/hooks/useBooks";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function PurchasesManager() {
  const { data: purchases, isLoading } = useAllPurchases();
  const { data: books } = useBooks();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [bookId, setBookId] = useState("");
  const [format, setFormat] = useState<"digital" | "physical" | "both">("digital");
  const [saving, setSaving] = useState(false);

  const handleGrant = async () => {
    if (!userEmail || !bookId) { toast.error("Email and book are required"); return; }
    setSaving(true);
    try {
      // Look up user by email in profiles
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", userEmail.trim())
        .maybeSingle();
      if (profileErr) throw profileErr;
      if (!profile) { toast.error("User not found with that email"); setSaving(false); return; }

      const book = books?.find(b => b.id === bookId);
      const { error } = await supabase.from("purchases").insert({
        user_id: profile.user_id,
        book_id: bookId,
        format,
        status: "completed",
        amount: book?.price || 0,
        granted_by: user?.id,
      });
      if (error) throw error;
      toast.success("Book access granted");
      queryClient.invalidateQueries({ queryKey: ["all-purchases"] });
      setOpen(false);
      setUserEmail("");
      setBookId("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this purchase?")) return;
    const { error } = await supabase.from("purchases").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Purchase revoked");
    queryClient.invalidateQueries({ queryKey: ["all-purchases"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Purchases / Access</h1>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Grant Access</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{(p.books as any)?.title || p.book_id}</TableCell>
                  <TableCell className="text-xs font-mono">{p.user_id.slice(0, 8)}...</TableCell>
                  <TableCell className="capitalize">{p.format}</TableCell>
                  <TableCell className="capitalize">{p.status}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleRevoke(p.id)} className="text-destructive"><Trash2 size={15} /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!purchases || purchases.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No purchases yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Grant Book Access</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>User Email *</Label><Input value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="user@example.com" /></div>
            <div>
              <Label>Book *</Label>
              <Select value={bookId} onValueChange={setBookId}>
                <SelectTrigger><SelectValue placeholder="Select book" /></SelectTrigger>
                <SelectContent>
                  {books?.map(b => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <Select value={format} onValueChange={v => setFormat(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleGrant} disabled={saving}>{saving ? "Granting..." : "Grant Access"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
