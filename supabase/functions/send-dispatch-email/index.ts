import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EmailAPIError, sendLovableEmail } from "npm:@lovable.dev/email-js@0.3.1";

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

      // ---- Program participation tracking setup ----
      const trackerBase = `${SUPABASE_URL}/functions/v1/track-email`;
      let program: { id: string; title: string; registration_url: string | null } | null = null;
      let matchMode = "manual";

      try {
        if (program_id) {
          const { data } = await supabase
            .from("programs")
            .select("id, title, registration_url")
            .eq("id", program_id)
            .maybeSingle();
          if (data) program = data as any;
        } else {
          const { data: allPrograms } = await supabase
            .from("programs")
            .select("id, title, registration_url")
            .not("registration_url", "is", null);
          const found = (allPrograms || []).find(
            (p: any) => p.registration_url && html_body.includes(p.registration_url)
          );
          if (found) {
            program = found as any;
            matchMode = "auto";
          }
        }
      } catch (err) {
        console.error("Program lookup failed:", err);
      }

      let dispatchId: string | null = null;
      const contactInfo = new Map<string, { full_name: string | null; country: string | null }>();

      if (program) {
        try {
          const { data: dispatchRow, error: dispatchError } = await supabase
            .from("program_dispatches")
            .insert({
              program_id: program.id,
              program_title: program.title,
              subject,
              recipient_count: uniqueRecipients.length,
              match_mode: matchMode,
            })
            .select("id")
            .single();
          if (dispatchError) throw dispatchError;
          dispatchId = dispatchRow.id;

          const { data: contacts } = await supabase
            .from("contacts")
            .select("email, first_name, last_name, country")
            .in("email", uniqueRecipients as string[]);
          for (const c of contacts || []) {
            if (!c.email) continue;
            contactInfo.set(String(c.email).toLowerCase(), {
              full_name: [c.first_name, c.last_name].filter(Boolean).join(" ") || null,
              country: c.country || null,
            });
          }
        } catch (err) {
          console.error("Failed to create program dispatch:", err);
        }
      }

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

          // Per-recipient tracking: pixel + click-through links
          let personalizedHtml = html_body;
          if (dispatchId && program) {
            try {
              const info = contactInfo.get(email) || { full_name: null, country: null };
              const { data: engagement, error: engagementError } = await supabase
                .from("program_engagements")
                .upsert(
                  {
                    dispatch_id: dispatchId,
                    program_id: program.id,
                    email,
                    full_name: info.full_name,
                    country: info.country,
                    sent_at: new Date().toISOString(),
                  },
                  { onConflict: "dispatch_id,email" }
                )
                .select("id")
                .single();
              if (engagementError) throw engagementError;

              if (program.registration_url) {
                const clickUrl = `${trackerBase}?e=${engagement.id}&t=click&u=${encodeURIComponent(program.registration_url)}`;
                personalizedHtml = personalizedHtml.split(program.registration_url).join(clickUrl);
              }
              personalizedHtml += `<img src="${trackerBase}?e=${engagement.id}&t=open" width="1" height="1" alt="" style="display:none" />`;
            } catch (err) {
              console.error("Tracking injection failed for", email, err);
            }
          }

          const request = {
            to: email,
            from: `${fromName} <${fromEmail}>`,
            sender_domain: senderDomain,
            subject,
            html: personalizedHtml,
            text: textBody || subject,
            purpose: "transactional" as const,
            label: "mail-dispatch",
            idempotency_key: messageId,
          };

          let suppressedRecipient = false;
          for (let attempt = 0; ; attempt++) {
            try {
              await sendLovableEmail(request, {
                apiKey: LOVABLE_API_KEY,
                sendUrl: Deno.env.get("LOVABLE_SEND_URL"),
              });
              break;
            } catch (sendErr) {
              if (sendErr instanceof EmailAPIError && sendErr.code === "recipient_suppressed") {
                suppressedRecipient = true;
                break;
              }
              if (sendErr instanceof EmailAPIError && sendErr.status === 429 && attempt < 3) {
                await new Promise((r) => setTimeout(r, (sendErr.retryAfterSeconds ?? 5) * 1000));
                continue;
              }
              throw sendErr;
            }
          }

          const status = suppressedRecipient ? "suppressed" : "sent";
          const { error: logError } = await supabase.from("email_send_log").insert({
            message_id: messageId,
            template_name: "mail-dispatch",
            recipient_email: email,
            status,
            metadata: { subject, sender_name: fromName },
          });
          if (logError) console.error("Failed to write email log:", logError.code, logError.message);

          results.push({ email, status: suppressedRecipient ? "suppressed" : "queued", message_id: messageId });
        } catch (err: any) {
          console.error("Failed to send email:", err?.message || err);
          const { error: logError } = await supabase.from("email_send_log").insert({
            message_id: messageId,
            template_name: "mail-dispatch",
            recipient_email: email,
            status: "failed",
            error_message: String(err?.message || err).slice(0, 1000),
            metadata: { subject, sender_name: fromName },
          });
          if (logError) console.error("Failed to write email log:", logError.code, logError.message);
          results.push({ email, status: "failed", error: err?.message || String(err), message_id: messageId });
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
