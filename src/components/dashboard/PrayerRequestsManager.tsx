import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, adminQuery, adminDelete } from "@/hooks/useBookstoreAdmin";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trash2, HandHeart, Eye } from "lucide-react";
import { toast } from "sonner";

export function PrayerRequestsManager() {
  const queryClient = useQueryClient();
  const isPublic = isPublicDashboard();
  const [selected, setSelected] = useState<any | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-prayer-requests"],
    queryFn: async () => {
      if (isPublic) return adminQuery("prayer_requests", "*", undefined, [{ column: "created_at", ascending: false }]);
      const { data, error } = await supabase.from("prayer_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this prayer request?")) return;
    try {
      if (isPublic) await adminDelete("prayer_requests", id);
      else { const { error } = await supabase.from("prayer_requests").delete().eq("id", id); if (error) throw error; }
      toast.success("Prayer request deleted");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin-prayer-requests"] });
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6"><HandHeart className="w-6 h-6 text-accent" /><h1 className="text-3xl font-bold">Prayer Requests</h1></div>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : !requests?.length ? (
        <p className="text-muted-foreground">No prayer requests yet.</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Category</TableHead><TableHead>Prayers</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {requests.map((r: any) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
                  <TableCell className="font-medium max-w-xs truncate">{r.title}</TableCell>
                  <TableCell>{r.is_anonymous ? "Anonymous" : r.author_name}</TableCell>
                  <TableCell><Badge variant="outline">{r.category}</Badge></TableCell>
                  <TableCell>{r.prayer_count}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => setSelected(r)}><Eye size={15} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-destructive"><Trash2 size={15} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              <span>{selected?.is_anonymous ? "Anonymous" : selected?.author_name}</span>
              {selected?.author_email && !selected?.is_anonymous && (
                <> · <a href={`mailto:${selected.author_email}`} className="text-accent underline">{selected.author_email}</a></>
              )}
              {selected?.created_at && (
                <span className="ml-2 text-xs text-muted-foreground">· {new Date(selected.created_at).toLocaleString()}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 text-xs">
            {selected?.category && <Badge variant="outline">{selected.category}</Badge>}
            {selected?.location && <Badge variant="outline">{selected.location}</Badge>}
            <Badge variant="secondary">{selected?.prayer_count ?? 0} prayers</Badge>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed rounded-lg bg-muted/40 p-4 max-h-[50vh] overflow-y-auto">
            {selected?.description || selected?.content || selected?.request || "(no content)"}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => selected && navigator.clipboard.writeText(selected.description || selected.content || "")}>Copy</Button>
            {selected?.author_email && !selected?.is_anonymous && (
              <Button asChild><a href={`mailto:${selected.author_email}?subject=Re: ${encodeURIComponent(selected.title || "your prayer request")}`}>Reply</a></Button>
            )}
            <Button variant="destructive" onClick={() => selected && handleDelete(selected.id)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
