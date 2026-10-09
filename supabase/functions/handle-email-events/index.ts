import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.3.1'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

type Reason = 'bounce' | 'complaint' | 'unsubscribe'
const STATUS: Record<Reason, string> = { bounce: 'bounced', complaint: 'complained', unsubscribe: 'suppressed' }
const MESSAGE: Record<Reason, string> = {
  bounce: 'Permanent bounce — email address is invalid or rejected',
  complaint: 'Spam complaint — recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
}

// Notification-only mirror of delivery outcomes into the app's tables.
async function record(reason: Reason, recipient: string, messageId: string | null | undefined, eventId: string) {
  const email = recipient.toLowerCase()
  const { error: supErr } = await supabase
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (supErr) {
    console.error('suppressed_emails write failed', { code: supErr.code, message: supErr.message, event_id: eventId })
    throw new Error('suppressed_emails write failed')
  }
  const { error: logErr } = await supabase.from('email_send_log').insert({
    message_id: messageId ?? null,
    template_name: 'system',
    recipient_email: email,
    status: STATUS[reason],
    error_message: MESSAGE[reason],
    metadata: null,
  })
  if (logErr) {
    console.error('email_send_log write failed', { code: logErr.code, message: logErr.message, event_id: eventId })
    throw new Error('email_send_log write failed')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': (event) => record('bounce', event.data.recipient, event.data.message_id, event.event_id),
    'email.complaint': (event) => record('complaint', event.data.recipient, event.data.message_id, event.event_id),
    'email.unsubscribed': (event) => record('unsubscribe', event.data.recipient, event.data.message_id, event.event_id),
  },
})

Deno.serve((req) => handler(req))
