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
    const resource = path[path.length - 1] || "";
    const secondLast = path.length >= 2 ? path[path.length - 2] : "";

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isDetailRequest = uuidRegex.test(resource);

    // --- GET /books ---
    if (req.method === "GET" && (resource === "books" || (isDetailRequest && secondLast === "books"))) {
      if (isDetailRequest) {
        const { data, error } = await supabase
          .from("books")
          .select("id, title, subtitle, author, short_description, description, cover_image_url, price, espees_price, ngn_price, is_digital, is_physical, pages, isbn, stock, featured, category_id")
          .eq("id", resource)
          .single();
        if (error) return jsonResponse({ error: "Book not found" }, 404);
        return jsonResponse(data);
      }

      const category = url.searchParams.get("category_id");
      const search = url.searchParams.get("search");
      const format = url.searchParams.get("format");
      const featured = url.searchParams.get("featured");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");

      let query = supabase
        .from("books")
        .select("id, title, subtitle, author, short_description, cover_image_url, price, espees_price, ngn_price, is_digital, is_physical, stock, featured, category_id");

      if (category) query = query.eq("category_id", category);
      if (format === "digital") query = query.eq("is_digital", true);
      if (format === "physical") query = query.eq("is_physical", true);
      if (featured === "true") query = query.eq("featured", true);
      if (search) {
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

    // --- GET /analytics ---
    if (req.method === "GET" && resource === "analytics") {
      const [ordersRes, booksRes, purchasesRes] = await Promise.all([
        supabase.from("purchase_orders").select("*"),
        supabase.from("books").select("id, title, cover_image_url, price, espees_price, ngn_price, is_digital, is_physical, stock, featured"),
        supabase.from("purchases").select("id, book_id, amount, format, status, created_at"),
      ]);

      const orders = ordersRes.data || [];
      const books = booksRes.data || [];
      const purchases = purchasesRes.data || [];

      const approved = orders.filter(o => o.status === "approved");
      const pending = orders.filter(o => o.status === "pending");
      const rejected = orders.filter(o => o.status === "rejected");

      const totalRevenue = approved.reduce((s, o) => s + (o.total_amount || 0), 0);
      const pendingRevenue = pending.reduce((s, o) => s + (o.total_amount || 0), 0);

      // Payment method breakdown
      const paymentMap: Record<string, { count: number; revenue: number }> = {};
      orders.forEach(o => {
        const m = o.payment_method || "unknown";
        if (!paymentMap[m]) paymentMap[m] = { count: 0, revenue: 0 };
        paymentMap[m].count++;
        if (o.status === "approved") paymentMap[m].revenue += o.total_amount || 0;
      });

      // Currency breakdown
      const currencyMap: Record<string, { count: number; revenue: number }> = {};
      approved.forEach(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach((item: any) => {
          const cur = (item.currency || "usd").toUpperCase();
          if (!currencyMap[cur]) currencyMap[cur] = { count: 0, revenue: 0 };
          currencyMap[cur].count += item.quantity || 1;
          currencyMap[cur].revenue += (item.price || 0) * (item.quantity || 1);
        });
      });

      // Book sales
      const bookSalesMap: Record<string, any> = {};
      approved.forEach(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach((item: any) => {
          const bid = item.book_id || "unknown";
          if (!bookSalesMap[bid]) {
            bookSalesMap[bid] = {
              book_id: bid, title: item.title || "Unknown",
              total_orders: 0, total_units: 0, total_revenue: 0,
              digital_units: 0, physical_units: 0,
            };
          }
          const entry = bookSalesMap[bid];
          entry.total_orders++;
          entry.total_units += item.quantity || 1;
          entry.total_revenue += (item.price || 0) * (item.quantity || 1);
          if (item.format === "digital") entry.digital_units += item.quantity || 1;
          else entry.physical_units += item.quantity || 1;
        });
      });

      const totalItemsSold = approved.reduce((s, o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        return s + items.reduce((is: number, i: any) => is + (i.quantity || 1), 0);
      }, 0);

      // Orders by day (last 30 days)
      const dayMap: Record<string, { orders: number; revenue: number }> = {};
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dayMap[d.toISOString().split("T")[0]] = { orders: 0, revenue: 0 };
      }
      orders.forEach(o => {
        const day = o.created_at?.split("T")[0];
        if (day && dayMap[day]) {
          dayMap[day].orders++;
          if (o.status === "approved") dayMap[day].revenue += o.total_amount || 0;
        }
      });

      // Stock alerts
      const stockAlerts = books
        .filter(b => b.is_physical && b.stock <= 5)
        .map(b => ({ id: b.id, title: b.title, stock: b.stock }))
        .sort((a, b) => a.stock - b.stock);

      return jsonResponse({
        overview: {
          total_books: books.length,
          total_orders: orders.length,
          pending_orders: pending.length,
          approved_orders: approved.length,
          rejected_orders: rejected.length,
          total_revenue: totalRevenue,
          pending_revenue: pendingRevenue,
          avg_order_value: approved.length > 0 ? totalRevenue / approved.length : 0,
          total_items_sold: totalItemsSold,
          total_purchases_granted: purchases.length,
        },
        payment_breakdown: Object.entries(paymentMap).map(([method, d]) => ({ method, ...d })),
        currency_breakdown: Object.entries(currencyMap).map(([currency, d]) => ({ currency, ...d })),
        book_sales: Object.values(bookSalesMap).sort((a: any, b: any) => b.total_revenue - a.total_revenue),
        orders_by_day: Object.entries(dayMap).map(([date, d]) => ({ date, ...d })),
        stock_alerts: stockAlerts,
        recent_orders: orders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map(o => ({
            id: o.id,
            payment_method: o.payment_method,
            total_amount: o.total_amount,
            status: o.status,
            item_count: Array.isArray(o.items) ? o.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 0,
            created_at: o.created_at,
          })),
      });
    }

    // --- POST /prayer-groups ---
    if (req.method === "POST" && resource === "prayer-groups") {
      const body = await req.json();
      const { name, description } = body;

      if (!name) return jsonResponse({ error: "name is required" }, 400);

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

    return jsonResponse({ error: "Not found. Available endpoints: GET /books, GET /books/:id, GET /categories, GET /analytics, POST /prayer-groups, POST /orders" }, 404);

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
