import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isPublicDashboard, getStoredPin } from "@/hooks/useBookstoreAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, Users, Plus, X, Loader2, Mail, RefreshCw, Upload, ClipboardPaste, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface Subscriber {
  email: string;
  full_name: string | null;
  is_active: boolean;
}

interface DispatchResult {
  sent: number;
  queued: number;
  failed: number;
  pending: number;
  suppressed: number;
  total: number;
  results: { message_id: string; recipient_email: string; status: string; error_message?: string; created_at: string }[];
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

  const getPin = (): string => {
    if (isPublic) return getStoredPin() || "";
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
  const [lastResult, setLastResult] = useState<DispatchResult | null>(null);
  const [lastMessageIds, setLastMessageIds] = useState<string[]>([]);
  const [pollingActive, setPollingActive] = useState(false);
  const [drilldownStatus, setDrilldownStatus] = useState<string | null>(null);

  const { data: subscribers = [], isLoading: loadingSubs, refetch: refetchSubs } = useQuery({
    queryKey: ["dispatch-subscribers"],
    queryFn: async () => {
      const res = await dispatchCall(getPin(), "get_subscribers");
      return (res.subscribers || []) as Subscriber[];
    },
  });

  const [bulkPasteOpen, setBulkPasteOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseEmails = (text: string): string[] => {
    const emailRegex = /[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/g;
    const matches = text.match(emailRegex) || [];
    return [...new Set(matches.map((e) => e.toLowerCase().trim()))];
  };

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

  const addBulkEmails = () => {
    const parsed = parseEmails(bulkText);
    if (parsed.length === 0) {
      toast.error("No valid emails found");
      return;
    }
    const newEmails = parsed.filter((e) => !manualEmails.includes(e));
    if (newEmails.length === 0) {
      toast.info("All emails already added");
      return;
    }
    setManualEmails((prev) => [...new Set([...prev, ...newEmails])]);
    setBulkText("");
    setBulkPasteOpen(false);
    toast.success(`Added ${newEmails.length} email${newEmails.length !== 1 ? "s" : ""}`);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error("Please upload a .csv or .txt file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseEmails(text);
      if (parsed.length === 0) {
        toast.error("No valid emails found in file");
        return;
      }
      const newEmails = parsed.filter((em) => !manualEmails.includes(em));
      setManualEmails((prev) => [...new Set([...prev, ...newEmails])]);
      toast.success(`Imported ${newEmails.length} email${newEmails.length !== 1 ? "s" : ""} from file`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    setLastMessageIds([]);
    setPollingActive(false);
    try {
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

      const queued = result.queued ?? result.sent;
      const messageIds = (result.results || [])
        .filter((r: any) => r.message_id)
        .map((r: any) => r.message_id);

      setLastMessageIds(messageIds);
      setLastResult({
        sent: 0, queued, failed: result.failed, pending: queued, suppressed: 0,
        total: result.total, results: [],
      });

      if (messageIds.length > 0) {
        setPollingActive(true);
      }

      if (result.failed === 0) {
        toast.success(`✅ ${queued} email${queued !== 1 ? "s" : ""} queued successfully!`);
      } else {
        toast.warning(`${queued} queued, ${result.failed} failed out of ${result.total}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  // Poll for delivery status
  const checkStatus = useCallback(async () => {
    if (lastMessageIds.length === 0) return;
    try {
      const data = await dispatchCall(getPin(), "get_dispatch_status", {
        message_ids: lastMessageIds,
      });
      setLastResult(data as DispatchResult);
      // Stop polling when no more pending
      if (data.pending === 0) {
        setPollingActive(false);
      }
    } catch (err) {
      console.error("Status check failed:", err);
    }
  }, [lastMessageIds]);

  useEffect(() => {
    if (!pollingActive || lastMessageIds.length === 0) return;
    // Initial check after 5s, then every 8s
    const timeout = setTimeout(() => {
      checkStatus();
    }, 5000);
    const interval = setInterval(checkStatus, 8000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [pollingActive, checkStatus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Send className="w-7 h-7 text-accent" />
        <h1 className="text-3xl font-bold">Mail Dispatch</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Compose and send emails to subscribers or specific addresses from{" "}
        <span className="font-semibold text-foreground">info@notify.ismprayernetwork.org</span>
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
              {/* Single email */}
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

              {/* Bulk actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setBulkPasteOpen(!bulkPasteOpen)}
                >
                  <ClipboardPaste size={14} className="mr-1" /> Paste Bulk
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} className="mr-1" /> Upload CSV
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
              </div>

              {/* Bulk paste area */}
              {bulkPasteOpen && (
                <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30">
                  <Label className="text-xs text-muted-foreground">
                    Paste emails (comma, semicolon, newline, or space separated)
                  </Label>
                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={"john@example.com, jane@example.com\nmark@example.com; sara@example.com"}
                    className="min-h-[100px] text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => { setBulkPasteOpen(false); setBulkText(""); }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={addBulkEmails} disabled={!bulkText.trim()}>
                      Add Emails
                    </Button>
                  </div>
                </div>
              )}

              {/* Tags */}
              {manualEmails.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{manualEmails.length} manual recipient{manualEmails.length !== 1 ? "s" : ""}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => setManualEmails([])}>
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto">
                    {manualEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
                        {email}
                        <button onClick={() => removeManualEmail(email)} className="ml-1 hover:text-destructive">
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
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
                <div className="text-sm p-3 rounded-lg bg-muted space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Dispatch Status:</p>
                    {pollingActive && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 size={12} className="animate-spin" /> Tracking...
                      </span>
                    )}
                    {!pollingActive && lastMessageIds.length > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={checkStatus}>
                        <RefreshCw size={12} className="mr-1" /> Refresh
                      </Button>
                    )}
                  </div>

                  {lastResult.pending > 0 && (
                    <button
                      onClick={() => setDrilldownStatus("pending")}
                      className="w-full flex items-center justify-between p-1.5 rounded hover:bg-background/50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <Clock size={14} /> Queued / Pending
                      </span>
                      <span className="font-semibold">{lastResult.pending}</span>
                    </button>
                  )}
                  {lastResult.sent > 0 && (
                    <button
                      onClick={() => setDrilldownStatus("sent")}
                      className="w-full flex items-center justify-between p-1.5 rounded hover:bg-background/50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle size={14} /> Sent Successfully
                      </span>
                      <span className="font-semibold">{lastResult.sent}</span>
                    </button>
                  )}
                  {lastResult.failed > 0 && (
                    <button
                      onClick={() => setDrilldownStatus("failed")}
                      className="w-full flex items-center justify-between p-1.5 rounded hover:bg-background/50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 text-destructive">
                        <XCircle size={14} /> Failed
                      </span>
                      <span className="font-semibold">{lastResult.failed}</span>
                    </button>
                  )}
                  {lastResult.suppressed > 0 && (
                    <button
                      onClick={() => setDrilldownStatus("suppressed")}
                      className="w-full flex items-center justify-between p-1.5 rounded hover:bg-background/50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <X size={14} /> Suppressed
                      </span>
                      <span className="font-semibold">{lastResult.suppressed}</span>
                    </button>
                  )}

                  <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                    Total: {lastResult.total} • Click a status to see details
                  </p>
                </div>
              )}

              {/* Drilldown dialog */}
              <Dialog open={!!drilldownStatus} onOpenChange={() => setDrilldownStatus(null)}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {drilldownStatus === "sent" && <><CheckCircle size={18} className="text-green-600" /> Sent Emails</>}
                      {drilldownStatus === "failed" && <><XCircle size={18} className="text-destructive" /> Failed Emails</>}
                      {drilldownStatus === "pending" && <><Clock size={18} className="text-amber-600" /> Pending Emails</>}
                      {drilldownStatus === "suppressed" && <><X size={18} className="text-muted-foreground" /> Suppressed Emails</>}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {lastResult?.results
                      ?.filter(r => {
                        if (drilldownStatus === "failed") return ["dlq", "failed"].includes(r.status);
                        return r.status === drilldownStatus;
                      })
                      .map((r, i) => (
                        <div key={i} className="flex items-start justify-between p-2 rounded-lg bg-muted/50 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{r.recipient_email}</p>
                            {r.error_message && (
                              <p className="text-xs text-destructive mt-0.5 line-clamp-2">{r.error_message}</p>
                            )}
                          </div>
                          <Badge variant={
                            r.status === "sent" ? "default" :
                            ["dlq", "failed"].includes(r.status) ? "destructive" :
                            "secondary"
                          } className="shrink-0 ml-2 text-[10px]">
                            {r.status}
                          </Badge>
                        </div>
                      )) || (
                        <p className="text-sm text-muted-foreground">No emails in this category.</p>
                      )
                    }
                    {drilldownStatus === "pending" && (
                      <p className="text-xs text-muted-foreground italic">
                        Pending emails are being processed. They'll move to Sent or Failed shortly.
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sending limits info */}
      <Card className="border-accent/30">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Sending limits:</strong> Max <strong>500 recipients</strong> per dispatch.
            Emails are queued and processed at ~120 emails/minute. Large batches may take a few minutes to fully deliver.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
