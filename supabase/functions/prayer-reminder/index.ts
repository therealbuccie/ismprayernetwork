import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find slots starting in ~30 minutes that haven't been reminded yet
    // We look for slots between 25-35 minutes from now to handle cron timing variance
    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + 25 * 60000);
    const reminderWindowEnd = new Date(now.getTime() + 35 * 60000);

    const todayStr = now.toISOString().split("T")[0];
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split("T")[0];

    // Get slots for today and tomorrow that need reminders
    const { data: slots, error } = await supabase
      .from("prayer_slots")
      .select("*")
      .eq("status", "booked")
      .eq("reminder_sent", false)
      .in("slot_date", [todayStr, tomorrowStr]);

    if (error) throw error;

    const slotsToRemind = (slots ?? []).filter((slot: any) => {
      const slotDateTime = new Date(`${slot.slot_date}T${slot.slot_time}`);
      return slotDateTime >= reminderWindowStart && slotDateTime <= reminderWindowEnd;
    });

    console.log(`Found ${slotsToRemind.length} slots needing reminders`);

    // For each slot, send an email reminder
    // Using Supabase's built-in email (via auth admin) or a simple approach
    const results = [];

    for (const slot of slotsToRemind) {
      const [h, m] = slot.slot_time.split(":").map(Number);
      const period = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      const timeFormatted = `${hour12}:${m.toString().padStart(2, "0")} ${period}`;

      // Use Lovable AI to send the reminder email
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (LOVABLE_API_KEY) {
        try {
          const emailResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-prayer-reminder`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                to: slot.user_email,
                name: slot.user_name,
                time: timeFormatted,
                date: slot.slot_date,
              }),
            }
          );
          console.log(`Email sent to ${slot.user_email}: ${emailResponse.status}`);
        } catch (emailErr) {
          console.error(`Failed to send email to ${slot.user_email}:`, emailErr);
        }
      }

      // Mark as reminded regardless
      await supabase
        .from("prayer_slots")
        .update({ reminder_sent: true })
        .eq("id", slot.id);

      results.push({ email: slot.user_email, time: timeFormatted });
    }

    return new Response(
      JSON.stringify({ success: true, reminded: results.length, slots: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Reminder error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
