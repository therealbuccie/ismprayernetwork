import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { setEmailUnsubscribe } from 'npm:@lovable.dev/email-js@0.3.1'

// Honors unsubscribe links in emails sent before the email update.
const SENDER_DOMAIN = 'notify.ismprayernetwork.org'
const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const url = new URL(req.url)
  let token = url.searchParams.get('token')
  if (req.method === 'POST') {
    try { token = (await req.json()).token || token } catch { /* ignore */ }
  }
  if (!token || token.length > 200) return json({ error: 'Token is required' }, 400)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: rec } = await supabase.from('email_unsubscribe_tokens').select('email, used_at').eq('token', token).maybeSingle()
  if (!rec) return json({ error: 'Invalid or expired token' }, 404)
  if (rec.used_at) return json({ valid: false, already_unsubscribed: true })
  if (req.method === 'GET') return json({ valid: true })

  try {
    await setEmailUnsubscribe(
      { recipient: rec.email, domain: SENDER_DOMAIN, subscribed: false },
      { apiKey: Deno.env.get('LOVABLE_API_KEY')!, sendUrl: Deno.env.get('LOVABLE_SEND_URL') },
    )
  } catch (e) {
    console.error('setEmailUnsubscribe failed', e instanceof Error ? e.message : e)
    return json({ error: 'Failed to process unsubscribe' }, 500)
  }
  const { error: uErr } = await supabase.from('email_unsubscribe_tokens').update({ used_at: new Date().toISOString() }).eq('token', token)
  if (uErr) console.error('token update failed', uErr.code, uErr.message)
  const { error: sErr } = await supabase.from('suppressed_emails')
    .upsert({ email: rec.email.toLowerCase(), reason: 'unsubscribe' }, { onConflict: 'email' })
  if (sErr) console.error('suppression write failed', sErr.code, sErr.message)
  return json({ success: true })
})
