import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    const validKey = Deno.env.get("PARTNER_API_KEY");

    if (!apiKey || apiKey !== validKey) {
      return new Response(JSON.stringify({ error: "Unauthorized. Invalid or missing API key." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);
    // path after /partner-api/ e.g. ["books"], ["books","<id>"], ["prayer-groups"], ["orders"]
    const resource = path[path.length - 1] || "";
    const secondLast = path.length >= 2 ? path[path.length - 2] : "";

    // Determine if it's a detail request (UUID as last segment)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isDetailRequest = uuidRegex.test(resource);

    // --- GET /books ---
    if (req.method === "GET" && (resource === "books" || (isDetailRequest && secondLast === "books"))) {
      if (isDetailRequest) {
        // Single book detail
        const { data, error } = await supabase
          .from("books")
          .select("id, title, subtitle, author, short_description, description, cover_image_url, price, is_digital, is_physical, pages, isbn, stock, featured, category_id")
          .eq("id", resource)
          .single();
        if (error) return jsonResponse({ error: "Book not found" }, 404);
        return jsonResponse(data);
      }

      // List books with optional filters
      const category = url.searchParams.get("category_id");
      const search = url.searchParams.get("search");
      const format = url.searchParams.get("format"); // digital | physical
      const featured = url.searchParams.get("featured");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");

      let query = supabase
        .from("books")
        .select("id, title, subtitle, author, short_description, cover_image_url, price, is_digital, is_physical, stock, featured, category_id");

      if (category) query = query.eq("category_id", category);
      if (format === "digital") query = query.eq("is_digital", true);
      if (format === "physical") query = query.eq("is_physical", true);
      if (featured === "true") query = query.eq("featured", true);
      if (search) {
        // Sanitize search input to prevent injection
        const sanitized = search.replace(/[%_\\]/g, '').slice(0, 100);
        if (sanitized) query = query.or(`title.ilike.%${sanitized}%,author.ilike.%${sanitized}%`);
      }

      const { data, error } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse({ books: data, count: data?.length ?? 0 });
    }

    // --- GET /categories ---
    if (req.method === "GET" && resource === "categories") {
      const { data, error } = await supabase.from("categories").select("id, name");
      if (error) throw error;
      return jsonResponse({ categories: data });
    }

    // --- POST /prayer-groups ---
    if (req.method === "POST" && resource === "prayer-groups") {
      const body = await req.json();
      const { name, description } = body;

      if (!name) return jsonResponse({ error: "name is required" }, 400);

      // Use service role to bypass RLS; create as a system-level public group
      // We need a created_by UUID — use a nil UUID to represent partner-created groups
      const partnerSystemId = "00000000-0000-0000-0000-000000000000";

      const { data, error } = await supabase.from("prayer_groups").insert({
        name,
        description: description || null,
        is_public: true,
        created_by: partnerSystemId,
      }).select().single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // --- POST /orders ---
    if (req.method === "POST" && resource === "orders") {
      const body = await req.json();
      const { items, payment_method, total_amount, external_user_id, external_user_name, espees_code, pop_image_url } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return jsonResponse({ error: "items array is required" }, 400);
      }
      if (!external_user_id) {
        return jsonResponse({ error: "external_user_id is required" }, 400);
      }

      // Use service role to bypass RLS
      // Store external_user_id as user_id field — since these are external users,
      // we use a deterministic UUID derived from their external ID
      const partnerUserId = "00000000-0000-0000-0000-000000000001";

      const { data, error } = await supabase.from("purchase_orders").insert({
        user_id: partnerUserId,
        items: items.map((i: any) => ({ ...i, external_user_id, external_user_name: external_user_name || "Partner User" })),
        payment_method: payment_method || "partner_api",
        total_amount: total_amount || 0,
        espees_code: espees_code || null,
        pop_image_url: pop_image_url || null,
        status: "pending",
      }).select().single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    return jsonResponse({ error: "Not found. Available endpoints: GET /books, GET /books/:id, GET /categories, POST /prayer-groups, POST /orders" }, 404);

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
      "Content-Type": "application/json",
    },
  });
}
