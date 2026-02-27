import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_PIN = "2323";

const ALLOWED_TABLES = [
  "books", "categories", "profiles", "testimonies", "programs", "events",
  "contact_messages", "newsletter_subscribers", "prayer_requests", "prayer_groups",
  "purchase_orders", "purchases", "site_settings",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { pin, action, table, data, filters, select, order, match } = body;

    if (pin !== VALID_PIN) {
      return new Response(JSON.stringify({ error: "Invalid PIN" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (table && !ALLOWED_TABLES.includes(table)) {
      return new Response(JSON.stringify({ error: "Table not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;

    switch (action) {
      case "select": {
        let query = supabase.from(table).select(select || "*");
        if (filters) {
          for (const f of filters) {
            if (f.op === "eq") query = query.eq(f.column, f.value);
            else if (f.op === "neq") query = query.neq(f.column, f.value);
            else if (f.op === "in") query = query.in(f.column, f.value);
          }
        }
        if (order) {
          for (const o of order) {
            query = query.order(o.column, { ascending: o.ascending ?? true });
          }
        }
        const { data: rows, error } = await query;
        if (error) throw error;
        result = rows;
        break;
      }

      case "count": {
        const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
        if (error) throw error;
        result = { count };
        break;
      }

      case "insert": {
        const { data: row, error } = await supabase.from(table).insert(data).select().single();
        if (error) throw error;
        result = row;
        break;
      }

      case "update": {
        const { id, ...record } = data;
        const { data: row, error } = await supabase.from(table).update(record).eq("id", id).select().single();
        if (error) throw error;
        result = row;
        break;
      }

      case "upsert": {
        const { data: row, error } = await supabase.from(table).upsert(data, { onConflict: match || "id" }).select().single();
        if (error) throw error;
        result = row;
        break;
      }

      case "delete": {
        const { error } = await supabase.from(table).delete().eq("id", data.id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "dashboard_stats": {
        // Fetch all stats in one call
        const [books, categories, profiles, testimonies, programs, events, 
               messages, subscribers, prayerRequests, prayerGroups, orders, purchases] = await Promise.all([
          supabase.from("books").select("*", { count: "exact", head: true }),
          supabase.from("categories").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("testimonies").select("*"),
          supabase.from("programs").select("*", { count: "exact", head: true }),
          supabase.from("events").select("*", { count: "exact", head: true }),
          supabase.from("contact_messages").select("*"),
          supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
          supabase.from("prayer_requests").select("*"),
          supabase.from("prayer_groups").select("*", { count: "exact", head: true }),
          supabase.from("purchase_orders").select("*"),
          supabase.from("purchases").select("*, books(title)"),
        ]);

        result = {
          counts: {
            books: books.count ?? 0,
            categories: categories.count ?? 0,
            users: profiles.count ?? 0,
            programs: programs.count ?? 0,
            events: events.count ?? 0,
            subscribers: subscribers.count ?? 0,
            prayerGroups: prayerGroups.count ?? 0,
          },
          testimonies: {
            total: testimonies.data?.length ?? 0,
            pending: testimonies.data?.filter((t: any) => !t.is_approved).length ?? 0,
            approved: testimonies.data?.filter((t: any) => t.is_approved).length ?? 0,
          },
          messages: {
            total: messages.data?.length ?? 0,
            recent: messages.data?.slice(0, 5) ?? [],
          },
          prayerRequests: {
            total: prayerRequests.data?.length ?? 0,
            totalPrayers: prayerRequests.data?.reduce((sum: number, r: any) => sum + (r.prayer_count || 0), 0) ?? 0,
          },
          orders: {
            total: orders.data?.length ?? 0,
            pending: orders.data?.filter((o: any) => o.status === "pending").length ?? 0,
            approved: orders.data?.filter((o: any) => o.status === "approved").length ?? 0,
            rejected: orders.data?.filter((o: any) => o.status === "rejected").length ?? 0,
            totalRevenue: orders.data?.filter((o: any) => o.status === "approved").reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) ?? 0,
            recent: orders.data?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5) ?? [],
          },
          purchases: {
            total: purchases.data?.length ?? 0,
            recent: purchases.data?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5) ?? [],
          },
        };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
