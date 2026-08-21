/**
 * Generic SMS adapter interface.
 *
 * No specific SMS provider is named anywhere in the project specification
 * (unlike WhatsApp Business API, which is explicitly named), so this adapter
 * exposes the interface the rest of the app depends on without wiring a
 * concrete provider. It always mocks — never claims a real SMS was sent —
 * until a provider is deliberately plugged in here.
 */
export async function sendSms({ to, message }) {
  console.log(`[smsService] No SMS provider configured. Would send SMS to ${to}: ${message}`)
  return { success: false, mocked: true, reason: 'no_provider_configured' }
}
