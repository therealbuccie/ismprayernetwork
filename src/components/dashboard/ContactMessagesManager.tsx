import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail } from "lucide-react";

export function ContactMessagesManager() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-accent" />
        <h1 className="text-3xl font-bold">Contact Messages</h1>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !messages?.length ? (
        <p className="text-muted-foreground">No messages yet.</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium">{msg.name}</TableCell>
                  <TableCell>{msg.email}</TableCell>
                  <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{timeAgo(msg.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
