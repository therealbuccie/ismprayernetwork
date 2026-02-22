import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function TestimoniesManager() {
  const queryClient = useQueryClient();

  const { data: testimonies, isLoading } = useQuery({
    queryKey: ["admin-testimonies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("testimonies").update({ is_approved: !currentStatus }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(currentStatus ? "Testimony unapproved" : "Testimony approved!");
    queryClient.invalidateQueries({ queryKey: ["admin-testimonies"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimony?")) return;
    const { error } = await supabase.from("testimonies").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Testimony deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-testimonies"] });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Testimonies</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !testimonies?.length ? (
        <p className="text-muted-foreground">No testimonies yet.</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonies.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium max-w-xs truncate">{t.title}</TableCell>
                  <TableCell>{t.author_name}</TableCell>
                  <TableCell>
                    <Badge className={t.is_approved ? "bg-green-500/20 text-green-700" : "bg-muted text-muted-foreground"}>
                      {t.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleApproval(t.id, t.is_approved)}>
                        {t.is_approved ? <XCircle size={15} className="text-muted-foreground" /> : <CheckCircle size={15} className="text-green-600" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-destructive">
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
