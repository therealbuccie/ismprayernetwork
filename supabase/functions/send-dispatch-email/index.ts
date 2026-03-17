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
    const { pin, action, recipients, subject, html_body, sender_name } = body;

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

    if (action === "send") {
      if (!recipients?.length || !subject || !html_body) {
        return new Response(
          JSON.stringify({ error: "recipients, subject, and html_body are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate inputs
      if (subject.length > 200) throw new Error("Subject too long");
      if (recipients.length > 500) throw new Error("Too many recipients (max 500)");

      const fromName = sender_name || "ISM Prayer Network";
      const fromEmail = "info@notify.ismprayernetwork.org";
      const results: { email: string; status: string; error?: string }[] = [];

      // Send emails one by one via Lovable AI Gateway (email endpoint)
      for (const email of recipients) {
        try {
          const res = await fetch("https://email.lovable.dev/v1/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${fromName} <${fromEmail}>`,
              to: [email],
              subject,
              html: html_body,
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            results.push({ email, status: "failed", error: `${res.status}: ${errText}` });
          } else {
            results.push({ email, status: "sent" });
          }
        } catch (err: any) {
          results.push({ email, status: "failed", error: err.message });
        }
      }

      const sent = results.filter((r) => r.status === "sent").length;
      const failed = results.filter((r) => r.status === "failed").length;

      return new Response(
        JSON.stringify({ sent, failed, total: recipients.length, results }),
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
