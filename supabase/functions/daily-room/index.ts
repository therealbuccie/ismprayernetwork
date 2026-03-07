import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            exp: Math.floor(Date.now() / 1000) + 3600 * 4, // 4 hours
          },
        }),
      });
      const tokenData = await tokenRes.json();

      return new Response(
        JSON.stringify({ url: existingRoom.url, token: tokenData.token, room_name: roomName }),
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
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          exp: Math.floor(Date.now() / 1000) + 3600 * 4,
        },
      }),
    });
    const tokenData = await tokenRes.json();

    return new Response(
      JSON.stringify({ url: room.url, token: tokenData.token, room_name: roomName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
