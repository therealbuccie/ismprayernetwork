import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, adminQuery, adminUpdate } from "@/hooks/useBookstoreAdmin";
import { useAuth, Profile } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

const roleOptions = [
  { value: "customer", label: "Customer", icon: User },
  { value: "admin", label: "Admin", icon: Shield },
  { value: "super-admin", label: "Super Admin", icon: ShieldCheck },
];

const roleBadgeColor: Record<string, string> = {
  "super-admin": "bg-accent text-accent-foreground",
  admin: "bg-primary text-primary-foreground",
  customer: "bg-muted text-muted-foreground",
};

export function UsersManager() {
  const { profile: currentProfile } = useAuth();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const isPublic = isPublicDashboard();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      if (isPublic) return adminQuery("profiles", "*", undefined, [{ column: "created_at", ascending: false }]);
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const changeRole = async (profileId: string, newRole: string) => {
    setUpdatingId(profileId);
    try {
      if (isPublic) {
        await adminUpdate("profiles", { id: profileId, role: newRole });
      } else {
        const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", profileId);
        if (error) throw error;
      }
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    } catch (err: any) { toast.error(err.message); } finally { setUpdatingId(null); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Users & Roles</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage user roles and permissions</p>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Current Role</TableHead><TableHead>Change Role</TableHead></TableRow></TableHeader>
            <TableBody>
              {profiles?.map((p: any) => {
                const isSelf = !isPublic && p.user_id === currentProfile?.user_id;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.email}</TableCell>
                    <TableCell>{p.full_name || "—"}</TableCell>
                    <TableCell><Badge className={roleBadgeColor[p.role] || "bg-muted"}>{p.role}</Badge></TableCell>
                    <TableCell>
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">Can't change own role</span>
                      ) : (
                        <Select value={p.role} onValueChange={(val) => changeRole(p.id, val)} disabled={updatingId === p.id}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>{roleOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
