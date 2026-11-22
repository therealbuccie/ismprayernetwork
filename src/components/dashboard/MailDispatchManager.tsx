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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Send, Users, Plus, X, Loader2, Mail, RefreshCw, Upload,
  ClipboardPaste, CheckCircle, XCircle, Clock, Settings,
  AlertCircle, ShieldCheck, Sparkles, CheckCircle2, PauseCircle
} from "lucide-react";
import { RichEmailComposer } from "./RichEmailComposer";
import { DispatchContactCategories } from "./DispatchContactCategories";
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
  updated_at?: string;
  results: { message_id: string; recipient_email: string; status: string; error_message?: string; created_at: string }[];
}

interface MailDispatchManagerProps {
  onNavigate?: (tab: string) => void;
}

async function dispatchCall(pin: string, action: string, params: Record<string, any> = {}) {
  try {
    const res = await fetch("/api/mail-dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, action, ...params }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  } catch (err: any) {
    // Edge function fallback if cloudflare worker route is unavailable
    try {
      const { data, error } = await supabase.functions.invoke("send-dispatch-email", {
        body: { pin, action, ...params },
      });
      if (error) throw err;
      if (data?.error) throw new Error(data.error);
      return data;
    } catch {
      throw err;
    }
  }
}

export function MailDispatchManager({ onNavigate }: MailDispatchManagerProps = {}) {
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
  const [drilldownStatus, setDrilldownStatus] = useState<string | null>(null);
  const [programId, setProgramId] = useState<string>("auto");

  // Chunked batch dispatch state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    currentBatch: 0,
    totalBatches: 0,
    sent: 0,
    failed: 0,
    totalRecipients: 0,
    isComplete: false,
    errorMessage: "",
  });
  const abortSendingRef = useRef(false);

  // Email provider configuration query
  const { data: emailConfig, refetch: refetchEmailConfig } = useQuery({
    queryKey: ["email-dispatcher-config"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/mail-dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_settings", pin: getPin() }),
        });
        const data = await res.json();
        return data?.settings || null;
      } catch (err) {
        console.warn("Could not query email settings:", err);
        return null;
      }
    },
    staleTime: 30000,
  });

  const isConfigured = Boolean(emailConfig?.is_configured);
  const fromEmail = emailConfig?.from_email || "info@notify.ismprayernetwork.org";

  const { data: recentStatus, refetch: refetchRecentStatus, isFetching: refreshingRecentStatus } = useQuery<DispatchResult>({
    queryKey: ["recent-dispatch-status"],
    queryFn: async () => {
      try {
        const res = await dispatchCall(getPin(), "get_recent_dispatch_status");
        if (res && typeof res.total === "number") return res as DispatchResult;
      } catch (err) {
        console.warn("Mail dispatch status query error:", err);
      }

      // Direct database query fallback
      try {
        const { data: rows, error } = await supabase
          .from("email_send_log")
          .select("message_id, recipient_email, status, error_message, created_at")
          .order("created_at", { ascending: false })
          .limit(300);

        if (error || !rows || rows.length === 0) {
          return { sent: 0, queued: 0, failed: 0, pending: 0, suppressed: 0, total: 0, results: [], updated_at: new Date().toISOString() };
        }

        const sent = rows.filter((r) => ["sent", "delivered"].includes(r.status)).length;
        const failed = rows.filter((r) => ["failed", "bounced", "complained", "rejected", "dlq"].includes(r.status)).length;
        const pending = rows.filter((r) => ["pending", "queued", "processing"].includes(r.status)).length;
        const suppressed = rows.filter((r) => r.status === "suppressed").length;

        return {
          sent,
          queued: pending,
          failed,
          pending,
          suppressed,
          total: rows.length,
          results: rows,
          updated_at: new Date().toISOString(),
        };
      } catch {
        return { sent: 0, queued: 0, failed: 0, pending: 0, suppressed: 0, total: 0, results: [], updated_at: new Date().toISOString() };
      }
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const { data: subscribers = [], isLoading: loadingSubs, refetch: refetchSubs } = useQuery({
    queryKey: ["dispatch-subscribers"],
    queryFn: async () => {
      try {
        const res = await dispatchCall(getPin(), "get_subscribers");
        if (res?.subscribers?.length) {
          return (res.subscribers || []) as Subscriber[];
        }
      } catch (err) {
        console.warn("Edge function get_subscribers unavailable, falling back to direct database query", err);
      }

      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("email, full_name, is_active")
        .eq("is_active", true)
        .order("subscribed_at", { ascending: false });

      if (error) {
        console.error("Direct subscribers query error:", error);
        return [];
      }
      return (data || []) as Subscriber[];
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["dispatch-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("id, title, event_date, registration_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
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

  // High-Speed Chunked Batch Send
  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (!body.trim()) { toast.error("Email body is required"); return; }
    if (allRecipients.length === 0) { toast.error("Select at least one recipient"); return; }

    if (!isConfigured) {
      toast.error("Email provider not configured. Please add your Resend API Key in SMTP & Email settings.");
      if (onNavigate) onNavigate("email-settings");
      return;
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px 16px; background: #ffffff; color: #202124;">
        <p style="margin: 0 0 20px; font-size: 15px; font-weight: 600;">${senderName}</p>
        <div style="line-height: 1.65; font-size: 15px;">
          ${body}
        </div>
        <p style="margin: 28px 0 0; color: #5f6368; font-size: 12px;">ISM Prayer Network</p>
      </div>
    `;

    // Split into batches of 50 for rapid and safe dispatch
    const CHUNK_SIZE = 50;
    const batches: string[][] = [];
    for (let i = 0; i < allRecipients.length; i += CHUNK_SIZE) {
      batches.push(allRecipients.slice(i, i + CHUNK_SIZE));
    }

    setSending(true);
    abortSendingRef.current = false;
    setBatchProgress({
      currentBatch: 0,
      totalBatches: batches.length,
      sent: 0,
      failed: 0,
      totalRecipients: allRecipients.length,
      isComplete: false,
      errorMessage: "",
    });
    setBatchModalOpen(true);

    let totalSent = 0;
    let totalFailed = 0;
    const collectedResults: any[] = [];
    const collectedMessageIds: string[] = [];

    try {
      for (let i = 0; i < batches.length; i++) {
        if (abortSendingRef.current) {
          toast.info(`Dispatch paused. Dispatched ${totalSent} emails.`);
          break;
        }

        setBatchProgress(prev => ({ ...prev, currentBatch: i + 1 }));

        try {
          const res = await dispatchCall(getPin(), "send_batch", {
            recipients: batches[i],
            subject: subject.trim(),
            html_body: htmlBody,
            sender_name: senderName.trim(),
            program_id: programId === "auto" ? null : programId,
          });

          const batchSent = res.sent ?? 0;
          const batchFailed = res.failed ?? 0;

          totalSent += batchSent;
          totalFailed += batchFailed;

          if (Array.isArray(res.results)) {
            collectedResults.push(...res.results);
            res.results.forEach((r: any) => {
              if (r.message_id) collectedMessageIds.push(r.message_id);
            });
          }

          setBatchProgress(prev => ({
            ...prev,
            sent: totalSent,
            failed: totalFailed,
          }));
        } catch (batchErr: any) {
          console.error(`Batch ${i + 1} transmission error:`, batchErr);
          totalFailed += batches[i].length;
          setBatchProgress(prev => ({
            ...prev,
            failed: totalFailed,
            errorMessage: batchErr.message || "Batch transmission failed",
          }));
        }
      }

      setLastMessageIds(collectedMessageIds);
      setLastResult({
        sent: totalSent,
        queued: 0,
        failed: totalFailed,
        pending: 0,
        suppressed: 0,
        total: allRecipients.length,
        results: collectedResults,
        updated_at: new Date().toISOString(),
      });

      setBatchProgress(prev => ({ ...prev, isComplete: true }));
      refetchRecentStatus();

      if (totalFailed === 0) {
        toast.success(`All ${totalSent} emails successfully sent!`);
      } else {
        toast.warning(`Sent ${totalSent} emails, ${totalFailed} failed.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Error running bulk dispatch");
      setBatchProgress(prev => ({ ...prev, isComplete: true, errorMessage: err.message }));
    } finally {
      setSending(false);
    }
  };

  const handleAbort = () => {
    abortSendingRef.current = true;
    toast.info("Stopping transmission after current batch...");
  };

  const handleBatchDialogClose = () => {
    if (sending) {
      handleAbort();
    }
    setBatchModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
            <Send className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mail Dispatch</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              High-throughput email broadcaster for newsletters, announcements, and partner updates.
            </p>
          </div>
        </div>

        {/* Provider Status Pill */}
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-300">Resend Active</span>
              <span className="text-muted-foreground text-[11px] hidden sm:inline">({fromEmail})</span>
              {onNavigate && (
                <button
                  onClick={() => onNavigate("email-settings")}
                  className="ml-1 text-emerald-400 hover:text-emerald-300 underline font-medium text-[11px]"
                >
                  Settings
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-300">
              <AlertCircle size={14} className="text-amber-400" />
              <span>SMTP Not Configured</span>
              {onNavigate && (
                <button
                  onClick={() => onNavigate("email-settings")}
                  className="ml-1 font-bold underline hover:text-amber-200"
                >
                  Configure Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delivery Metrics Bar */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold text-sm text-foreground">Outbound Delivery Activity</p>
              <p className="text-xs text-muted-foreground">
                {recentStatus?.updated_at
                  ? `Updated ${new Date(recentStatus.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                  : "Loading live status…"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchRecentStatus()} disabled={refreshingRecentStatus} className="h-8 text-xs">
              <RefreshCw size={12} className={refreshingRecentStatus ? "animate-spin mr-1.5" : "mr-1.5"} /> Refresh Stats
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Sent & Delivered</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{recentStatus?.sent ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">In Progress</p>
              <p className="text-2xl font-bold text-amber-400 mt-0.5">{recentStatus?.pending ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Suppressed / Unsubscribed</p>
              <p className="text-2xl font-bold text-muted-foreground mt-0.5">{recentStatus?.suppressed ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Failed / Bounced</p>
              <p className="text-2xl font-bold text-rose-400 mt-0.5">{recentStatus?.failed ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" /> Compose Email Broadcast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sender-name" className="text-xs">Sender Name</Label>
                  <Input
                    id="sender-name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="ISM Prayer Network"
                    className="mt-1 text-xs"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label className="text-xs">Program Participation Tracking</Label>
                  <Select value={programId} onValueChange={setProgramId}>
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue placeholder="Auto-detect program link" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect from email body links</SelectItem>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subject" className="text-xs">Subject Line</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Special Global Prayer Gathering - Live Link & Prayer Points"
                  className="mt-1 text-xs"
                  maxLength={200}
                />
              </div>

              <RichEmailComposer
                value={body}
                onChange={setBody}
                senderName={senderName}
              />
            </CardContent>
          </Card>

          {/* Manual recipients */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent" /> Add Manual or CSV Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="minister@example.com"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManualEmail())}
                  className="flex-1 text-xs"
                />
                <Button variant="outline" onClick={addManualEmail} size="sm" className="text-xs">
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setBulkPasteOpen(!bulkPasteOpen)}
                >
                  <ClipboardPaste size={13} className="mr-1.5" /> Paste Bulk List
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={13} className="mr-1.5" /> Import CSV / TXT
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
              </div>

              {bulkPasteOpen && (
                <div className="space-y-2 p-3 border border-border/60 rounded-xl bg-muted/30">
                  <Label className="text-xs text-muted-foreground">
                    Paste emails separated by commas, semicolons, or line breaks:
                  </Label>
                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={"pastor.john@church.org, minister.mary@loveworld.com\nbrother.stephen@ministry.net"}
                    className="min-h-[100px] text-xs font-mono"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => { setBulkPasteOpen(false); setBulkText(""); }} className="text-xs">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={addBulkEmails} disabled={!bulkText.trim()} className="text-xs">
                      Add to List
                    </Button>
                  </div>
                </div>
              )}

              {manualEmails.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">
                      {manualEmails.length} manual recipient{manualEmails.length !== 1 ? "s" : ""}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive hover:text-destructive" onClick={() => setManualEmails([])}>
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1">
                    {manualEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1 pr-1 text-xs font-normal">
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

        {/* Right sidebar: Subscribers & Categorized Database */}
        <div className="space-y-4">
          {/* Subscribers card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" /> Subscribers
                </span>
                <Button variant="ghost" size="icon" onClick={() => refetchSubs()} className="h-7 w-7 text-muted-foreground">
                  <RefreshCw size={13} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSubs ? (
                <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                  <Loader2 size={14} className="animate-spin" /> Loading subscribers...
                </div>
              ) : subscribers.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No active subscribers found.</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={(c) => handleSelectAll(!!c)}
                      id="select-all"
                    />
                    <Label htmlFor="select-all" className="text-xs font-semibold cursor-pointer">
                      Select all ({subscribers.length})
                    </Label>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                    {subscribers.map((s) => (
                      <div
                        key={s.email}
                        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/40 cursor-pointer text-xs"
                        onClick={() => toggleSubscriber(s.email)}
                      >
                        <Checkbox
                          checked={selectedSubscribers.includes(s.email)}
                          onCheckedChange={() => toggleSubscriber(s.email)}
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{s.full_name || s.email}</p>
                          {s.full_name && (
                            <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categorised database contacts */}
          <DispatchContactCategories
            selectedEmails={manualEmails}
            onAddEmails={(emails) =>
              setManualEmails((prev) => [...new Set([...prev, ...emails])])
            }
          />

          {/* Dispatch Action Card */}
          <Card className="border-accent/40 bg-card/80 shadow-md">
            <CardContent className="pt-6 space-y-4">
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subscribers selected:</span>
                  <strong className="text-foreground">{selectedSubscribers.length}</strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Manual / Database emails:</span>
                  <strong className="text-foreground">{manualEmails.length}</strong>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-semibold">
                  <span className="text-foreground">Total recipients:</span>
                  <span className="text-accent">{allRecipients.length}</span>
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={sending || allRecipients.length === 0}
                className="w-full gold-gradient-bg text-accent-foreground font-bold hover:opacity-90 transition-opacity"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" /> Dispatched in batches...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Send to {allRecipients.length} Recipient{allRecipients.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>

              {lastResult && (
                <div className="text-xs p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Last Dispatch Result:</span>
                    <Badge variant="outline" className="text-[10px]">
                      {lastResult.sent} / {lastResult.total} Sent
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <p className="text-[10px]">Delivered</p>
                      <p className="font-bold text-sm">{lastResult.sent}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                      <p className="text-[10px]">Failed</p>
                      <p className="font-bold text-sm">{lastResult.failed}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Batch Send Live Progress Modal */}
      <Dialog open={batchModalOpen} onOpenChange={handleBatchDialogClose}>
        <DialogContent className="max-w-md bg-card border-border/80 p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {batchProgress.isComplete ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Dispatch Complete
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 text-accent animate-spin" /> Transmitting Bulk Dispatch
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {batchProgress.isComplete
                ? "All recipient chunks have been processed through the Resend batch API."
                : `Broadcasting batch ${batchProgress.currentBatch} of ${batchProgress.totalBatches} (${batchProgress.totalRecipients} total recipients)...`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-accent">
                  {Math.round(((batchProgress.sent + batchProgress.failed) / (batchProgress.totalRecipients || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted/60 overflow-hidden border border-border/40">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round(((batchProgress.sent + batchProgress.failed) / (batchProgress.totalRecipients || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl border border-border/40 bg-muted/20">
                <p className="text-[10px] text-muted-foreground font-semibold">Batches</p>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {batchProgress.currentBatch} / {batchProgress.totalBatches}
                </p>
              </div>
              <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <p className="text-[10px] font-semibold">Sent</p>
                <p className="text-sm font-bold mt-0.5">{batchProgress.sent}</p>
              </div>
              <div className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
                <p className="text-[10px] font-semibold">Failed</p>
                <p className="text-sm font-bold mt-0.5">{batchProgress.failed}</p>
              </div>
            </div>

            {batchProgress.errorMessage && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle size={13} /> Batch Error
                </p>
                <p className="text-[11px] mt-1 break-words">{batchProgress.errorMessage}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            {!batchProgress.isComplete ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleAbort}
                className="text-xs"
              >
                <PauseCircle size={14} className="mr-1.5" /> Pause Transmission
              </Button>
            ) : (
              <Button
                onClick={() => setBatchModalOpen(false)}
                size="sm"
                className="gold-gradient-bg text-accent-foreground text-xs font-semibold px-5"
              >
                Done
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
