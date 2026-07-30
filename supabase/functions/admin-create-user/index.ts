import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ROLES = ["customer", "admin", "super-admin"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Missing authorization" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401);

    const { data: callerProfile } = await admin
      .from("profiles").select("role").eq("user_id", userData.user.id).maybeSingle();
    if (!callerProfile || !["admin", "super-admin"].includes(callerProfile.role)) {
      return json({ error: "Admin access required" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.full_name || "").trim();
    const role = String(body.role || "admin");

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Valid email required" }, 400);
    if (!ALLOWED_ROLES.includes(role)) return json({ error: "Invalid role" }, 400);
    if (role === "super-admin" && callerProfile.role !== "super-admin") {
      return json({ error: "Only a super admin can create a super admin" }, 403);
    }

    // Existing account? Just upgrade the role.
    const { data: existing } = await admin
      .from("profiles").select("id, user_id").eq("email", email).maybeSingle();

    if (existing) {
      const { error } = await admin.from("profiles").update({ role }).eq("id", existing.id);
      if (error) throw error;
      return json({ status: "upgraded", email, role });
    }

    if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr) return json({ error: createErr.message }, 400);

    const { error: roleErr } = await admin
      .from("profiles").update({ role, full_name: fullName || null }).eq("user_id", created.user!.id);
    if (roleErr) throw roleErr;

    return json({ status: "created", email, role });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
