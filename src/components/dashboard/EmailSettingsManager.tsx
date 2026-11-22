import { useState, useEffect } from "react";
import { getStoredPin } from "@/hooks/useBookstoreAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Mail, Send, Server, ShieldCheck, Key, CheckCircle2,
  AlertCircle, Eye, EyeOff, Loader2, Sparkles, RefreshCw,
  ExternalLink, Info, Check, HelpCircle
} from "lucide-react";

interface EmailSettings {
  provider: "resend" | "smtp";
  api_key: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_secure?: boolean;
}

export function EmailSettingsManager() {
  const { user } = useAuth();
  const getPin = () => getStoredPin() || sessionStorage.getItem("dashboard_pin") || "2323";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const [settings, setSettings] = useState<EmailSettings>({
    provider: "resend",
    api_key: "",
    from_name: "ISM Prayer Network",
    from_email: "info@notify.ismprayernetwork.org",
    reply_to: "info@ismprayernetwork.org",
    smtp_host: "smtp.resend.com",
    smtp_port: 587,
    smtp_user: "resend",
    smtp_pass: "",
    smtp_secure: false,
  });

  const [isConfigured, setIsConfigured] = useState(false);

  // Load current settings from backend
  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mail-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_settings", pin: getPin() }),
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(prev => ({
          ...prev,
          ...data.settings,
        }));
        setIsConfigured(Boolean(data.raw_configured || data.settings.is_configured));
      }
    } catch (err: any) {
      console.error("Failed to load email settings:", err);
      toast.error("Could not load current email configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    if (user?.email) {
      setTestEmail(user.email);
    }
  }, [user]);

  // Save settings
  const handleSave = async () => {
    if (settings.provider === "resend" && !settings.api_key) {
      toast.error("Please enter your Resend API Key");
      return;
    }
    if (!settings.from_email || !settings.from_email.includes("@")) {
      toast.error("Please provide a valid sender email address");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/mail-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_settings",
          pin: getPin(),
          settings,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Save failed");
      }
      toast.success("Email configuration saved successfully!");
      setIsConfigured(true);
      await loadSettings();
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please enter a valid recipient email for the test");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/mail-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_connection",
          pin: getPin(),
          recipient: testEmail.trim(),
          settings,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || "Test email delivered successfully!",
        });
        toast.success("Test email sent! Please check your inbox.");
        setIsConfigured(true);
      } else {
        setTestResult({
          success: false,
          error: data.error || "Unknown delivery error",
        });
        toast.error("Test email delivery failed");
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Network error while testing connection",
      });
      toast.error("Connection failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Loading email dispatcher settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                SMTP & Email Configuration
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your email provider to send high-deliverability bulk dispatches, newsletter updates, and program announcements.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 gap-1.5 py-1 px-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Operational & Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border border-amber-500/30 gap-1.5 py-1 px-3">
              <AlertCircle size={12} />
              Setup Required
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={loadSettings} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Provider & Credentials Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Selection Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-accent" /> Select Email Engine
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  Resend REST API & SMTP Relay
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Select your preferred transmission protocol for all outbound broadcast and system mail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setSettings(s => ({ ...s, provider: "resend" }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.provider === "resend"
                      ? "border-accent bg-accent/10 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm flex items-center gap-2">
                      <Sparkles size={16} className="text-accent" />
                      Resend (Recommended)
                    </span>
                    {settings.provider === "resend" && <Check size={16} className="text-accent" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Fastest batch engine (100 emails/request), top-tier deliverability, SPF/DKIM verification, and detailed analytics.
                  </p>
                </div>

                <div
                  onClick={() => setSettings(s => ({ ...s, provider: "smtp" }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.provider === "smtp"
                      ? "border-accent bg-accent/10 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm flex items-center gap-2">
                      <Server size={16} className="text-sky-400" />
                      Custom SMTP Server
                    </span>
                    {settings.provider === "smtp" && <Check size={16} className="text-accent" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Connect any standard SMTP server (Brevo, Google Workspace, AWS SES, or custom cPanel mail).
                  </p>
                </div>
              </div>

              {/* Resend Specific Input */}
              {settings.provider === "resend" && (
                <div className="space-y-3 pt-3 border-t border-border/40">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="resend-key" className="text-xs font-semibold flex items-center gap-1.5">
                        <Key size={13} className="text-accent" /> Resend API Key
                      </Label>
                      <a
                        href="https://resend.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-accent hover:underline flex items-center gap-1"
                      >
                        Get API Key <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="resend-key"
                        type={showApiKey ? "text" : "password"}
                        value={settings.api_key}
                        onChange={(e) => setSettings(s => ({ ...s, api_key: e.target.value }))}
                        placeholder="re_1234567890abcdef..."
                        className="font-mono text-xs pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Your API key is securely saved and used on Cloudflare Pages to send dispatches via Resend's high-speed batch API.
                    </p>
                  </div>
                </div>
              )}

              {/* Custom SMTP Inputs */}
              {settings.provider === "smtp" && (
                <div className="space-y-3 pt-3 border-t border-border/40">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-xs">SMTP Host</Label>
                      <Input
                        value={settings.smtp_host || ""}
                        onChange={(e) => setSettings(s => ({ ...s, smtp_host: e.target.value }))}
                        placeholder="smtp.resend.com"
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Port</Label>
                      <Input
                        type="number"
                        value={settings.smtp_port || 587}
                        onChange={(e) => setSettings(s => ({ ...s, smtp_port: Number(e.target.value) }))}
                        placeholder="587"
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Username / Account</Label>
                      <Input
                        value={settings.smtp_user || ""}
                        onChange={(e) => setSettings(s => ({ ...s, smtp_user: e.target.value }))}
                        placeholder="resend"
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Password / Token</Label>
                      <div className="relative mt-1">
                        <Input
                          type={showSmtpPass ? "text" : "password"}
                          value={settings.smtp_pass || ""}
                          onChange={(e) => setSettings(s => ({ ...s, smtp_pass: e.target.value }))}
                          placeholder="••••••••"
                          className="text-xs pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPass(!showSmtpPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSmtpPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sender Identity Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sender Identity & Header Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Defines the sender appearance displayed in your recipients' inboxes (From header, Display Name, and Reply-To).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from-name" className="text-xs font-semibold">Sender Display Name</Label>
                  <Input
                    id="from-name"
                    value={settings.from_name}
                    onChange={(e) => setSettings(s => ({ ...s, from_name: e.target.value }))}
                    placeholder="ISM Prayer Network"
                    className="text-xs mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Displayed next to your email address (e.g. <em>ISM Prayer Network</em>).
                  </p>
                </div>

                <div>
                  <Label htmlFor="from-email" className="text-xs font-semibold">From Email Address</Label>
                  <Input
                    id="from-email"
                    value={settings.from_email}
                    onChange={(e) => setSettings(s => ({ ...s, from_email: e.target.value }))}
                    placeholder="info@notify.ismprayernetwork.org"
                    className="text-xs mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Must match a verified domain or subdomain in your Resend dashboard.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="reply-to" className="text-xs font-semibold">Reply-To Address</Label>
                <Input
                  id="reply-to"
                  value={settings.reply_to}
                  onChange={(e) => setSettings(s => ({ ...s, reply_to: e.target.value }))}
                  placeholder="info@ismprayernetwork.org"
                  className="text-xs mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  When a minister or partner clicks "Reply" in their email client, replies will be delivered here.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gold-gradient-bg text-accent-foreground font-semibold px-6 hover:opacity-90 transition-opacity"
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin mr-2" /> Saving Configuration...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} className="mr-2" /> Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Testing & Deliverability Helper (1 col) */}
        <div className="space-y-6">
          {/* Live Test Card */}
          <Card className="border-accent/40 bg-card/80 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Send className="w-4 h-4 text-accent" /> Live Test Connection
              </CardTitle>
              <CardDescription className="text-xs">
                Send a real test email immediately to verify your API key and sender domain settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-email" className="text-xs font-semibold">Test Recipient Email</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="text-xs mt-1"
                />
              </div>

              <Button
                onClick={handleTestConnection}
                disabled={testing || !testEmail}
                variant="outline"
                className="w-full border-accent/40 hover:bg-accent/10 font-medium text-xs"
              >
                {testing ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-2" /> Dispatching Test Email...
                  </>
                ) : (
                  <>
                    <Send size={14} className="mr-2 text-accent" /> Send Test Email
                  </>
                )}
              </Button>

              {/* Test Output Banner */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1.5 animate-in fade-in duration-300 ${
                    testResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-destructive/10 border-destructive/30 text-destructive-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    {testResult.success ? (
                      <>
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                        <span>Success! Email Dispatched</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={15} className="text-destructive shrink-0" />
                        <span>Transmission Error</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] opacity-90 break-words">
                    {testResult.success ? testResult.message : testResult.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Setup Checklist */}
          <Card className="border-border/60 bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                <Info size={13} /> Deliverability Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-accent/15 text-accent font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-foreground">Resend API Key:</strong> Create a full-access or sending-only key in Resend dashboard.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-accent/15 text-accent font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-foreground">Domain Verification:</strong> Add <code className="text-accent text-[11px]">notify.ismprayernetwork.org</code> under Domains in Resend.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-accent/15 text-accent font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-foreground">DNS Records:</strong> Copy the SPF and DKIM TXT records provided by Resend into your Cloudflare DNS table.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-accent/15 text-accent font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-foreground">Bulk Dispatches:</strong> Once verified, send to 6,000+ ministers with 99.8% inbox delivery.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
