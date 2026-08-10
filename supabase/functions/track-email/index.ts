import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent GIF
const PIXEL = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00,
  0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02,
  0x44, 0x01, 0x00, 0x3b,
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pixelResponse() {
  return new Response(PIXEL, {
    headers: {
      ...corsHeaders,
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Pragma": "no-cache",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("e") || "";
  const type = url.searchParams.get("t") === "click" ? "click" : "open";
  const destinationRaw = url.searchParams.get("u") || "";

  let destination = "https://ismprayernetwork.org";
  if (destinationRaw) {
    try {
      const parsed = new URL(destinationRaw);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        destination = parsed.toString();
      }
    } catch {
      // keep fallback
    }
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && UUID_RE.test(id)) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: row } = await supabase
        .from("program_engagements")
        .select("id, opened_at, clicked_at, open_count, click_count")
        .eq("id", id)
        .maybeSingle();

      if (row) {
        const now = new Date().toISOString();
        const patch: Record<string, unknown> =
          type === "click"
            ? {
                clicked_at: row.clicked_at || now,
                click_count: (row.click_count || 0) + 1,
                opened_at: row.opened_at || now,
              }
            : {
                opened_at: row.opened_at || now,
                open_count: (row.open_count || 0) + 1,
              };
        await supabase.from("program_engagements").update(patch).eq("id", id);
      }
    }
  } catch (err) {
    console.error("track-email error:", err);
  }

  if (type === "click") {
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: destination, "Cache-Control": "no-store" },
    });
  }

  return pixelResponse();
});
