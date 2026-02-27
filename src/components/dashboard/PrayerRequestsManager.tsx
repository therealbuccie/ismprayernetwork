import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, adminQuery, adminDelete } from "@/hooks/useBookstoreAdmin";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, HandHeart } from "lucide-react";
import { toast } from "sonner";

export function PrayerRequestsManager() {
  const queryClient = useQueryClient();
  const isPublic = isPublicDashboard();

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
                <TableRow key={r.id}>
                  <TableCell className="font-medium max-w-xs truncate">{r.title}</TableCell>
                  <TableCell>{r.is_anonymous ? "Anonymous" : r.author_name}</TableCell>
                  <TableCell><Badge variant="outline">{r.category}</Badge></TableCell>
                  <TableCell>{r.prayer_count}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-destructive"><Trash2 size={15} /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
