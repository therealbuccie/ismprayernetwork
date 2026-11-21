interface Env {
  DAILY_API_KEY?: string;
  VITE_DAILY_CO_DOMAIN?: string;
}

const DEFAULT_DAILY_KEY = "a8dd8df7edfb72b92de4e43e699eae5c91c1a3a8509658cd95179a177e7f19b8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

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
    const apiKey = env.DAILY_API_KEY || DEFAULT_DAILY_KEY;
    const body = await request.json().catch(() => ({})) as any;
    const { group_slug } = body;

    if (!group_slug) {
      return new Response(JSON.stringify({ error: "group_slug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const roomName = `prayer-${group_slug}`;
    const tokenProperties = {
      room_name: roomName,
      exp: Math.floor(Date.now() / 1000) + 3600 * 4, // 4 hours
    };

    // Check if room already exists
    const checkRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (checkRes.ok) {
      const existingRoom = await checkRes.json() as any;
      const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties: tokenProperties }),
      });
      const tokenData = await tokenRes.json() as any;

      return new Response(
        JSON.stringify({
          url: existingRoom.url,
          token: tokenData.token,
          room_name: roomName,
          is_moderator: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new room if not found
    const createRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
      return new Response(JSON.stringify({ error: `Failed to create Daily room: ${err}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const room = await createRes.json() as any;

    const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: tokenProperties }),
    });
    const tokenData = await tokenRes.json() as any;

    return new Response(
      JSON.stringify({
        url: room.url,
        token: tokenData.token,
        room_name: roomName,
        is_moderator: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
