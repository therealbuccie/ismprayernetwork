const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const SUPABASE_URL = "https://cgkyvnedexkwpcojipuu.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNna3l2bmVkZXhrd3Bjb2ppcHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NTE3MzEsImV4cCI6MjEwODQyNzczMX0.Xyp5mBfs7sIezSi5MkFry-hFbXprijH1VoNfEfcY_Ik";

interface EmailSettings {
  provider: "resend" | "smtp";
  account_tier?: "free" | "pro";
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

const DEFAULT_SETTINGS: EmailSettings = {
  provider: "resend",
  account_tier: "free",
  api_key: "",
  from_name: "ISM Prayer Network",
  from_email: "info@notify.ismprayernetwork.org",
  reply_to: "info@ismprayernetwork.org",
  smtp_host: "smtp.resend.com",
  smtp_port: 587,
  smtp_user: "resend",
  smtp_pass: "",
  smtp_secure: false,
};

async function callDbAdmin(body: Record<string, any>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/dashboard_admin`, {
    method: "POST",
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`DB Admin RPC error (${res.status}): ${txt}`);
  }
  return res.json();
}

async function getStoredSettings(): Promise<{ id?: string; settings: EmailSettings }> {
  try {
    const rows = await callDbAdmin({ action: "select", table: "site_settings", pin: "2323" });
    if (Array.isArray(rows)) {
      const row = rows.find((r: any) => r.key === "email_settings");
      if (row && row.value) {
        return {
          id: row.id,
          settings: { ...DEFAULT_SETTINGS, ...row.value },
        };
      }
    }
  } catch (err) {
    console.error("Failed to fetch email_settings:", err);
  }
  return { settings: DEFAULT_SETTINGS };
}

async function saveStoredSettings(newSettings: Partial<EmailSettings>, existingId?: string) {
  const { id: foundId, settings: current } = await getStoredSettings();
  const targetId = existingId || foundId;
  const merged = { ...current, ...newSettings };

  if (targetId) {
    await callDbAdmin({
      action: "delete",
      table: "site_settings",
      pin: "2323",
      id: targetId,
    });
  }

  const newId = crypto.randomUUID();
  const insertRes = await callDbAdmin({
    action: "insert",
    table: "site_settings",
    pin: "2323",
    data: {
      id: newId,
      key: "email_settings",
      value: merged,
      updated_at: new Date().toISOString(),
    },
  });

  return { id: newId, settings: merged, insertRes };
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action, pin } = body;

    // PIN check for protected actions
    if (action !== "public_track") {
      if (!pin || pin !== "2323") {
        return new Response(JSON.stringify({ error: "Invalid PIN" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 1. GET SETTINGS
    if (action === "get_settings") {
      const { settings } = await getStoredSettings();
      // Mask API key for UI response
      const maskedKey = settings.api_key
        ? `${settings.api_key.slice(0, 5)}••••••••${settings.api_key.slice(-4)}`
        : "";
      const maskedPass = settings.smtp_pass ? "••••••••" : "";

      return new Response(
        JSON.stringify({
          settings: {
            ...settings,
            api_key: maskedKey,
            smtp_pass: maskedPass,
            is_configured: Boolean(settings.api_key || settings.smtp_pass),
          },
          raw_configured: Boolean(settings.api_key || settings.smtp_pass),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. SAVE SETTINGS
    if (action === "save_settings") {
      const incoming = body.settings || {};
      const { settings: current } = await getStoredSettings();

      // Don't overwrite if masked value was sent back without changing
      const toSave: EmailSettings = {
        provider: incoming.provider || current.provider,
        account_tier: incoming.account_tier || current.account_tier || "free",
        api_key: (incoming.api_key && !incoming.api_key.includes("••••")) ? incoming.api_key.trim() : current.api_key,
        from_name: incoming.from_name?.trim() || current.from_name,
        from_email: incoming.from_email?.trim() || current.from_email,
        reply_to: incoming.reply_to?.trim() || current.reply_to,
        smtp_host: incoming.smtp_host?.trim() || current.smtp_host,
        smtp_port: Number(incoming.smtp_port) || current.smtp_port,
        smtp_user: incoming.smtp_user?.trim() || current.smtp_user,
        smtp_pass: (incoming.smtp_pass && incoming.smtp_pass !== "••••••••") ? incoming.smtp_pass : current.smtp_pass,
        smtp_secure: Boolean(incoming.smtp_secure),
      };

      const result = await saveStoredSettings(toSave);
      return new Response(
        JSON.stringify({ success: true, message: "Settings saved successfully", is_configured: Boolean(toSave.api_key) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. TEST CONNECTION
    if (action === "test_connection") {
      const { recipient, settings: draftSettings } = body;
      if (!recipient || !recipient.includes("@")) {
        return new Response(JSON.stringify({ success: false, error: "Valid recipient email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { settings: stored } = await getStoredSettings();
      const activeSettings: EmailSettings = {
        ...stored,
        ...(draftSettings || {}),
        api_key: (draftSettings?.api_key && !draftSettings.api_key.includes("••••")) ? draftSettings.api_key.trim() : stored.api_key,
      };

      if (!activeSettings.api_key) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Resend API Key is missing. Please enter your API key (e.g. re_...) and save or test.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const fromAddress = `${activeSettings.from_name} <${activeSettings.from_email}>`;
      const testHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #0c0e14; color: #f3f4f6; border-radius: 12px; border: 1px solid #1f2937;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; padding: 10px 18px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 9999px; color: #000; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
              SMTP / Email Test
            </div>
          </div>
          <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 12px; text-align: center;">
            Connection Verified Successfully!
          </h2>
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; text-align: center; margin: 0 0 24px;">
            Your email dispatcher is properly configured and operational. Bulk dispatches can now be sent at high speed.
          </p>
          <div style="background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
            <p style="margin: 4px 0; color: #9ca3af;"><strong style="color: #d1d5db;">Provider:</strong> ${activeSettings.provider.toUpperCase()} (REST API & SMTP)</p>
            <p style="margin: 4px 0; color: #9ca3af;"><strong style="color: #d1d5db;">From:</strong> ${fromAddress}</p>
            <p style="margin: 4px 0; color: #9ca3af;"><strong style="color: #d1d5db;">Reply-To:</strong> ${activeSettings.reply_to || "None"}</p>
            <p style="margin: 4px 0; color: #9ca3af;"><strong style="color: #d1d5db;">Delivered To:</strong> ${recipient}</p>
            <p style="margin: 4px 0; color: #9ca3af;"><strong style="color: #d1d5db;">Timestamp:</strong> ${new Date().toUTCString()}</p>
          </div>
          <div style="text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 16px;">
            ISM Prayer Network • Global Ministers & Intercessors Network
          </div>
        </div>
      `;

      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${activeSettings.api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [recipient],
            reply_to: activeSettings.reply_to || undefined,
            subject: "✅ ISM Prayer Network - SMTP Test Email",
            html: testHtml,
          }),
        });

        const resendData = await resendRes.json();

        if (!resendRes.ok) {
          const errMsg = resendData.message || resendData.error || `HTTP ${resendRes.status}`;
          return new Response(
            JSON.stringify({
              success: false,
              error: `Resend error: ${errMsg}. If your domain is not verified yet, ensure the domain is added in Resend, or test from onboarding@resend.dev.`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Test email sent successfully! Message ID: ${resendData.id}`,
            id: resendData.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (sendErr: any) {
        return new Response(
          JSON.stringify({ success: false, error: `Connection failed: ${sendErr.message || String(sendErr)}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 4. SEND BATCH (Supports up to 100 emails in single call via Resend Batch API)
    if (action === "send" || action === "send_batch") {
      const { recipients, subject, html_body, sender_name, program_id } = body;

      if (!recipients?.length || !subject || !html_body) {
        return new Response(
          JSON.stringify({ error: "recipients, subject, and html_body are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { settings } = await getStoredSettings();
      if (!settings.api_key) {
        return new Response(
          JSON.stringify({
            error: "Resend API key is not configured. Go to Configuration -> SMTP & Email to enter your API key.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const fromName = sender_name?.trim() || settings.from_name || "ISM Prayer Network";
      const fromEmail = settings.from_email || "info@notify.ismprayernetwork.org";
      const replyTo = settings.reply_to || "info@ismprayernetwork.org";
      const fromFormatted = `${fromName} <${fromEmail}>`;

      // Deduplicate and filter valid emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validRecipients = Array.from(
        new Set(
          recipients
            .map((r: string) => String(r).trim().toLowerCase())
            .filter((r: string) => emailRegex.test(r))
        )
      );

      if (validRecipients.length === 0) {
        return new Response(
          JSON.stringify({ error: "No valid email addresses found in recipients list" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Cap single batch at 100 (Resend batch limit)
      const batchRecipients = validRecipients.slice(0, 100);

      // Prepare batch payload for Resend
      const batchPayload = batchRecipients.map((email: string) => ({
        from: fromFormatted,
        to: [email],
        reply_to: replyTo || undefined,
        subject,
        html: html_body,
        headers: {
          "X-Entity-Ref-ID": `mpn-${crypto.randomUUID()}`,
        },
      }));

      const resendRes = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchPayload),
      });

      const resendData = await resendRes.json();

      if (!resendRes.ok) {
        const errMsg = resendData.message || resendData.error || `HTTP ${resendRes.status}`;
        const isLimit = resendRes.status === 429 || /limit|daily|exceeded|quota/i.test(errMsg);
        return new Response(
          JSON.stringify({
            sent: 0,
            failed: batchRecipients.length,
            error: errMsg,
            is_limit_reached: isLimit,
            total: batchRecipients.length,
            results: batchRecipients.map((em: string) => ({ email: em, status: "failed", error: errMsg })),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Resend batch response contains an array of results with IDs
      const returnedData = resendData.data || (Array.isArray(resendData) ? resendData : []);
      const results = batchRecipients.map((email: string, idx: number) => {
        const item = returnedData[idx] || {};
        return {
          email,
          status: item.id ? "sent" : "failed",
          message_id: item.id || `resend-${crypto.randomUUID()}`,
        };
      });

      const sentCount = results.filter((r: any) => r.status === "sent").length;
      const failedCount = results.filter((r: any) => r.status === "failed").length;

      return new Response(
        JSON.stringify({
          sent: sentCount,
          queued: sentCount,
          failed: failedCount,
          total: batchRecipients.length,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. GET SUBSCRIBERS
    if (action === "get_subscribers") {
      const rows = await callDbAdmin({ action: "select", table: "newsletter_subscribers", pin: "2323" });
      const subscribers = Array.isArray(rows)
        ? rows.filter((r: any) => r.is_active !== false).map((r: any) => ({ email: r.email, full_name: r.full_name, is_active: true }))
        : [];
      return new Response(JSON.stringify({ subscribers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. GET CONTACTS (paginated / categorized)
    if (action === "get_contacts") {
      const rows = await callDbAdmin({ action: "select", table: "contacts", pin: "2323" });
      return new Response(JSON.stringify({ contacts: rows || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. GET RECENT DISPATCH STATUS
    if (action === "get_recent_dispatch_status") {
      return new Response(
        JSON.stringify({
          sent: 0,
          pending: 0,
          failed: 0,
          suppressed: 0,
          total: 0,
          results: [],
          updated_at: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("mail-dispatch function error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
