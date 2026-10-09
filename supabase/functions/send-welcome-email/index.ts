import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Called by the profiles insert trigger. The recipient is looked up from the
// profile row (trusted data); the idempotency key makes repeats harmless.
const UUID = /^[0-9a-f-]{36}$/i

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  let profileId = ''
  try {
    profileId = String((await req.json()).profileId || '')
  } catch { /* fallthrough */ }
  if (!UUID.test(profileId)) return json({ error: 'profileId required' }, 400)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, ministry_name, created_at')
    .eq('id', profileId)
    .maybeSingle()
  if (error || !profile?.email) return json({ error: 'Profile not found' }, 404)
  // Only welcome freshly created profiles
  if (Date.now() - new Date(profile.created_at).getTime() > 24 * 3600 * 1000) return json({ skipped: true })

  const log = async (status: string, error_message?: string) => {
    const { error: e } = await supabase.from('email_send_log').insert({
      message_id: null, template_name: 'welcome-signup', recipient_email: profile.email, status, error_message,
    })
    if (e) console.error('email_send_log write failed', e.code, e.message)
  }

  try {
    const result = await sendTemplateEmail('welcome-signup', profile.email, {
      templateData: { fullName: profile.full_name || '', ministryName: profile.ministry_name || '' },
      idempotencyKey: 'welcome-signup-' + profile.id,
    })
    await log(result.sent ? 'sent' : 'suppressed')
    return json({ success: result.sent })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await log('failed', msg.slice(0, 1000))
    return json({ error: 'Send failed' }, 500)
  }
})
