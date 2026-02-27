import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_PIN = "2323";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pin, action, data } = await req.json();

    if (pin !== VALID_PIN) {
      return new Response(JSON.stringify({ error: "Invalid PIN" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;

    switch (action) {
      case "insert_book": {
        const { data: row, error } = await supabase.from("books").insert(data).select().single();
        if (error) throw error;
        result = row;
        break;
      }
      case "update_book": {
        const { id, ...record } = data;
        const { data: row, error } = await supabase.from("books").update(record).eq("id", id).select().single();
        if (error) throw error;
        result = row;
        break;
      }
      case "delete_book": {
        const { error } = await supabase.from("books").delete().eq("id", data.id);
        if (error) throw error;
        result = { success: true };
        break;
      }
      case "insert_category": {
        const { data: row, error } = await supabase.from("categories").insert(data).select().single();
        if (error) throw error;
        result = row;
        break;
      }
      case "update_category": {
        const { id, ...record } = data;
        const { data: row, error } = await supabase.from("categories").update(record).eq("id", id).select().single();
        if (error) throw error;
        result = row;
        break;
      }
      case "delete_category": {
        const { error } = await supabase.from("categories").delete().eq("id", data.id);
        if (error) throw error;
        result = { success: true };
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
