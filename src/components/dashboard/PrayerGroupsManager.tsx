import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, adminQuery, adminDelete } from "@/hooks/useBookstoreAdmin";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";

export function PrayerGroupsManager() {
  const queryClient = useQueryClient();
  const isPublic = isPublicDashboard();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["admin-prayer-groups"],
    queryFn: async () => {
      if (isPublic) return adminQuery("prayer_groups", "*", undefined, [{ column: "created_at", ascending: false }]);
      const { data, error } = await supabase.from("prayer_groups").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this community?")) return;
    try {
      if (isPublic) await adminDelete("prayer_groups", id);
      else { const { error } = await supabase.from("prayer_groups").delete().eq("id", id); if (error) throw error; }
      toast.success("Community deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-prayer-groups"] });
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6"><UsersRound className="w-6 h-6 text-accent" /><h1 className="text-3xl font-bold">Communities</h1></div>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : !groups?.length ? (
        <p className="text-muted-foreground">No communities yet.</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Members</TableHead><TableHead>Visibility</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {groups.map((g: any) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell>{g.member_count}</TableCell>
                  <TableCell><Badge className={g.is_public ? "bg-green-500/20 text-green-700" : "bg-muted text-muted-foreground"}>{g.is_public ? "Public" : "Private"}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)} className="text-destructive"><Trash2 size={15} /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
