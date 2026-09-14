import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

// Decides, server-side, whether the caller may moderate this group's prayer call.
// Moderator = the group's creator, or a platform admin/super-admin.
async function resolveModerator(req: Request, groupSlug: string): Promise<boolean> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return false;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(jwt);
    const userId = userData?.user?.id;
    if (!userId) return false;

    const { data: isAdmin } = await admin.rpc("is_admin", { user_uuid: userId });
    if (isAdmin === true) return true;

    const { data: group } = await admin
      .from("prayer_groups")
      .select("created_by")
      .eq("slug", groupSlug)
      .maybeSingle();

    return group?.created_by === userId;
  } catch (_err) {
    return false;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
    if (!DAILY_API_KEY) {
      return new Response(JSON.stringify({ error: "Daily API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { group_slug, group_name } = await req.json();

    if (!group_slug) {
      return new Response(JSON.stringify({ error: "group_slug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use a deterministic room name based on group slug
    const roomName = `prayer-${group_slug}`;

    const isModerator = await resolveModerator(req, group_slug);
    const tokenProperties = {
      room_name: roomName,
      exp: Math.floor(Date.now() / 1000) + 3600 * 4, // 4 hours
      ...(isModerator ? { is_owner: true } : {}),
    };

    // Check if room already exists
    const checkRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
    });

    if (checkRes.ok) {
      const existingRoom = await checkRes.json();
      // Create a meeting token for the participant
      const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties: tokenProperties }),
      });
      const tokenData = await tokenRes.json();

      return new Response(
        JSON.stringify({ url: existingRoom.url, token: tokenData.token, room_name: roomName, is_moderator: isModerator }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new room
    const createRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          enable_knocking: false,
          start_video_off: true,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 hours
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return new Response(JSON.stringify({ error: `Failed to create room: ${err}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const room = await createRes.json();

    // Create meeting token
    const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: tokenProperties }),
    });
    const tokenData = await tokenRes.json();

    return new Response(
      JSON.stringify({ url: room.url, token: tokenData.token, room_name: roomName, is_moderator: isModerator }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
