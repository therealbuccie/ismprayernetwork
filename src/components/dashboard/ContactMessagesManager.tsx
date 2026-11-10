import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, adminQuery, getStoredPin } from "@/hooks/useBookstoreAdmin";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Eye } from "lucide-react";

export function ContactMessagesManager() {
  const isPublic = isPublicDashboard();
  const [selected, setSelected] = useState<any | null>(null);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [sending, setSending] = useState(false);

  const escapeHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    const pin = getStoredPin() || pinInput.trim();
    if (!pin) { toast.error("Enter the admin PIN to send"); return; }
    setSending(true);
    try {
      const quoted = escapeHtml(selected.message || "").replace(/\n/g, "<br/>");
      const html_body = `<p>Dear ${escapeHtml(selected.name || "")},</p><p>${escapeHtml(replyText).replace(/\n/g, "<br/>")}</p><p>Blessings,<br/>ISM Prayer Network</p><hr/><p style="color:#888;font-size:12px">Your message:<br/>${quoted}</p>`;
      const { data, error } = await supabase.functions.invoke("send-dispatch-email", {
        body: { pin, action: "send", recipients: [selected.email], subject: "Re: your message to ISM Prayer Network", html_body },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const failed = (data?.results || []).find((r: any) => r.status !== "sent" && r.status !== "queued");
      if (failed) throw new Error(failed.error || failed.status);
      toast.success(`Reply sent to ${selected.email}`);
      setReplyText(""); setReplying(false);
    } catch (e: any) {
      toast.error(`Could not send reply: ${e.message || e}`);
    } finally { setSending(false); }
  };

  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      if (isPublic) return adminQuery("contact_messages", "*", undefined, [{ column: "created_at", ascending: false }]);
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
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
      <div className="flex items-center gap-3 mb-6"><Mail className="w-6 h-6 text-accent" /><h1 className="text-3xl font-bold">Contact Messages</h1></div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !messages?.length ? (
        <p className="text-muted-foreground">No messages yet.</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Message</TableHead><TableHead>Date</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
            <TableBody>
              {messages.map((msg: any) => (
                <TableRow key={msg.id} className="cursor-pointer" onClick={() => setSelected(msg)}>
                  <TableCell className="font-medium">{msg.name}</TableCell>
                  <TableCell>{msg.email}</TableCell>
                  <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{timeAgo(msg.created_at)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelected(msg); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setReplying(false); setReplyText(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              <a href={`mailto:${selected?.email}`} className="text-accent underline">{selected?.email}</a>
              {selected?.created_at && <span className="ml-2 text-xs text-muted-foreground">· {new Date(selected.created_at).toLocaleString()}</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm leading-relaxed max-h-[60vh] overflow-y-auto rounded-lg bg-muted/40 p-4">
            {selected?.message}
          </div>
          {replying && (
            <div className="space-y-2">
              <Textarea dir="ltr" rows={6} placeholder={`Write your reply to ${selected?.name}…`} value={replyText} onChange={(e) => setReplyText(e.target.value)} autoFocus />
              {!getStoredPin() && (
                <Input type="password" placeholder="Admin PIN" value={pinInput} onChange={(e) => setPinInput(e.target.value)} />
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => selected && navigator.clipboard.writeText(selected.message)}>Copy</Button>
            {replying ? (
              <>
                <Button variant="ghost" onClick={() => setReplying(false)} disabled={sending}>Cancel</Button>
                <Button onClick={sendReply} disabled={sending || !replyText.trim()}>{sending ? "Sending…" : "Send Reply"}</Button>
              </>
            ) : (
              <Button onClick={() => setReplying(true)}>Reply</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
