import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, getStoredPin } from "@/hooks/useBookstoreAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, Users, Plus, X, Loader2, Mail, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface Subscriber {
  email: string;
  full_name: string | null;
  is_active: boolean;
}

async function dispatchCall(pin: string, action: string, params: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke("send-dispatch-email", {
    body: { pin, action, ...params },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function MailDispatchManager() {
  const { profile } = useAuth();
  const isPublic = isPublicDashboard();

  // Get PIN - from session for public, or use auth for admin
  const getPin = (): string => {
    if (isPublic) return getStoredPin() || "";
    // For authenticated admin, we use a stored PIN or the admin PIN
    return sessionStorage.getItem("dashboard_pin") || "2323";
  };

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [senderName, setSenderName] = useState("ISM Prayer Network");
  const [manualEmail, setManualEmail] = useState("");
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const { data: subscribers = [], isLoading: loadingSubs, refetch: refetchSubs } = useQuery({
    queryKey: ["dispatch-subscribers"],
    queryFn: async () => {
      const res = await dispatchCall(getPin(), "get_subscribers");
      return (res.subscribers || []) as Subscriber[];
    },
  });

  const addManualEmail = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (manualEmails.includes(email)) {
      toast.info("Email already added");
      return;
    }
    setManualEmails((prev) => [...prev, email]);
    setManualEmail("");
  };

  const removeManualEmail = (email: string) => {
    setManualEmails((prev) => prev.filter((e) => e !== email));
  };

  const toggleSubscriber = (email: string) => {
    setSelectedSubscribers((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSubscribers(subscribers.map((s) => s.email));
    } else {
      setSelectedSubscribers([]);
    }
  };

  const allRecipients = [...new Set([...selectedSubscribers, ...manualEmails])];

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (!body.trim()) { toast.error("Email body is required"); return; }
    if (allRecipients.length === 0) { toast.error("Select at least one recipient"); return; }

    setSending(true);
    setLastResult(null);
    try {
      // Wrap body in a simple HTML template
      const htmlBody = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #d4a843;">
            <h2 style="color: #1a1a1a; margin: 0; font-size: 20px;">${senderName}</h2>
          </div>
          <div style="color: #333333; line-height: 1.7; font-size: 15px;">
            ${body.replace(/\n/g, "<br/>")}
          </div>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">Sent from ISM Prayer Network</p>
          </div>
        </div>
      `;

      const result = await dispatchCall(getPin(), "send", {
        recipients: allRecipients,
        subject: subject.trim(),
        html_body: htmlBody,
        sender_name: senderName.trim(),
      });

      setLastResult({ sent: result.sent, failed: result.failed, total: result.total });

      if (result.failed === 0) {
        toast.success(`✅ All ${result.sent} emails sent successfully!`);
      } else {
        toast.warning(`${result.sent} sent, ${result.failed} failed out of ${result.total}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Send className="w-7 h-7 text-accent" />
        <h1 className="text-3xl font-bold">Mail Dispatch</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Compose and send emails to subscribers or specific addresses from{" "}
        <span className="font-semibold text-foreground">info@notify.jollof.space</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose area */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5" /> Compose Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sender-name">Sender Name</Label>
                <Input
                  id="sender-name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="ISM Prayer Network"
                  className="mt-1"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line..."
                  className="mt-1"
                  maxLength={200}
                />
              </div>
              <div>
                <Label htmlFor="body">Body (plain text, line breaks preserved)</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email content here..."
                  className="mt-1 min-h-[200px]"
                  maxLength={10000}
                />
              </div>
            </CardContent>
          </Card>

          {/* Manual emails */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Manual Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="email@example.com"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManualEmail())}
                  className="flex-1"
                />
                <Button variant="outline" onClick={addManualEmail} size="sm">
                  <Plus size={16} /> Add
                </Button>
              </div>
              {manualEmails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {manualEmails.map((email) => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-1 pr-1">
                      {email}
                      <button onClick={() => removeManualEmail(email)} className="ml-1 hover:text-destructive">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscribers sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" /> Subscribers
                </span>
                <Button variant="ghost" size="icon" onClick={() => refetchSubs()} className="h-7 w-7">
                  <RefreshCw size={14} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSubs ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : subscribers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active subscribers.</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={(c) => handleSelectAll(!!c)}
                      id="select-all"
                    />
                    <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select all ({subscribers.length})
                    </Label>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto space-y-1">
                    {subscribers.map((s) => (
                      <div
                        key={s.email}
                        className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleSubscriber(s.email)}
                      >
                        <Checkbox
                          checked={selectedSubscribers.includes(s.email)}
                          onCheckedChange={() => toggleSubscriber(s.email)}
                        />
                        <div className="min-w-0">
                          <p className="text-sm truncate">{s.full_name || s.email}</p>
                          {s.full_name && (
                            <p className="text-[11px] text-muted-foreground truncate">{s.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send summary */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Subscribers selected:</span>{" "}
                  <strong>{selectedSubscribers.length}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Manual emails:</span>{" "}
                  <strong>{manualEmails.length}</strong>
                </p>
                <p className="border-t border-border pt-1">
                  <span className="text-muted-foreground">Total recipients:</span>{" "}
                  <strong className="text-foreground">{allRecipients.length}</strong>
                </p>
              </div>

              <Button
                onClick={handleSend}
                disabled={sending || allRecipients.length === 0}
                className="w-full gold-gradient-bg text-accent-foreground hover:opacity-90"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" /> Send to {allRecipients.length} recipient
                    {allRecipients.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>

              {lastResult && (
                <div className="text-sm p-3 rounded-lg bg-muted space-y-1">
                  <p className="font-medium">Last dispatch result:</p>
                  <p className="text-green-600">✅ Sent: {lastResult.sent}</p>
                  {lastResult.failed > 0 && (
                    <p className="text-destructive">❌ Failed: {lastResult.failed}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
