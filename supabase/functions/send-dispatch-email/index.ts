import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ADMIN_PIN = Deno.env.get("ADMIN_PIN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!ADMIN_PIN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY) {
      throw new Error("Missing required environment variables");
    }

    const body = await req.json();
    const { pin, action, recipients, subject, html_body, sender_name, program_id } = body;

    // PIN validation
    if (!pin || pin !== ADMIN_PIN) {
      return new Response(JSON.stringify({ error: "Invalid PIN" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_subscribers") {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("email, full_name, is_active")
        .eq("is_active", true)
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ subscribers: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_contacts") {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabase
        .from("contacts")
        .select("email, first_name, last_name, country, source, group_name")
        .not("email", "is", null)
        .order("created_at", { ascending: false })
        .range(0, 19999);
      if (error) throw error;
      return new Response(JSON.stringify({ contacts: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    if (action === "get_dispatch_status") {
      const { message_ids } = body;
      if (!message_ids?.length) {
        return new Response(JSON.stringify({ error: "message_ids required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabase
        .from("email_send_log")
        .select("message_id, recipient_email, status, error_message, created_at")
        .in("message_id", message_ids)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Deduplicate: latest status per message_id
      const latest = new Map<string, any>();
      for (const row of data || []) {
        if (!latest.has(row.message_id)) {
          latest.set(row.message_id, row);
        }
      }
      const results = Array.from(latest.values());
      const sent = results.filter(r => r.status === "sent").length;
      const failed = results.filter(r => ["dlq", "failed"].includes(r.status)).length;
      const pending = results.filter(r => r.status === "pending").length;
      const suppressed = results.filter(r => r.status === "suppressed").length;

      return new Response(JSON.stringify({
        sent, failed, pending, suppressed, total: results.length, results,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "send") {
      if (!recipients?.length || !subject || !html_body) {
        return new Response(
          JSON.stringify({ error: "recipients, subject, and html_body are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (subject.length > 200) throw new Error("Subject too long");
      if (recipients.length > 500) throw new Error("Too many recipients (max 500)");

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const fromName = sender_name?.trim() || "ISM Prayer Network";
      const fromEmail = "noreply@notify.ismprayernetwork.org";
      const senderDomain = "notify.ismprayernetwork.org";
      const uniqueRecipients = Array.from(
        new Set(
          recipients
            .map((email: string) => email.trim().toLowerCase())
            .filter((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        )
      );
      const results: { email: string; status: string; error?: string; message_id?: string }[] = [];

      for (const email of uniqueRecipients) {
        const messageId = `mail-dispatch-${crypto.randomUUID()}`;

        try {
          const textBody = html_body
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/\s+\n/g, "\n")
            .replace(/\n\s+/g, "\n")
            .replace(/[ \t]+/g, " ")
            .trim();

          const { data: existingToken, error: tokenReadError } = await supabase
            .from("email_unsubscribe_tokens")
            .select("token")
            .eq("email", email)
            .is("used_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (tokenReadError) throw tokenReadError;

          const unsubscribeToken = existingToken?.token || crypto.randomUUID();
          if (!existingToken?.token) {
            const { error: tokenInsertError } = await supabase
              .from("email_unsubscribe_tokens")
              .insert({ email, token: unsubscribeToken });
            if (tokenInsertError) throw tokenInsertError;
          }

          const payload = {
            to: email,
            from: `${fromName} <${fromEmail}>`,
            sender_domain: senderDomain,
            subject,
            html: html_body,
            text: textBody || subject,
            purpose: "transactional",
            label: "mail-dispatch",
            unsubscribe_token: unsubscribeToken,
            message_id: messageId,
            idempotency_key: messageId,
            queued_at: new Date().toISOString(),
          };

          const { error: enqueueError } = await supabase.rpc("enqueue_email", {
            queue_name: "transactional_emails",
            payload,
          });
          if (enqueueError) throw enqueueError;

          const { error: logError } = await supabase.from("email_send_log").insert({
            message_id: messageId,
            template_name: "mail-dispatch",
            recipient_email: email,
            status: "pending",
            metadata: {
              subject,
              sender_name: fromName,
            },
          });
          if (logError) {
            console.error("Failed to write pending email log:", logError);
          }

          results.push({ email, status: "queued", message_id: messageId });
        } catch (err: any) {
          console.error("Failed to queue email:", email, err?.message || err);
          results.push({ email, status: "failed", error: err?.message || String(err) });
        }
      }

      const queued = results.filter((r) => r.status === "queued").length;
      const failed = results.filter((r) => r.status === "failed").length;

      return new Response(
        JSON.stringify({ sent: queued, queued, failed, total: uniqueRecipients.length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-dispatch-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
