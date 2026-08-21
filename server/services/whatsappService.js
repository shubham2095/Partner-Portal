import { env } from '../config/env.js'

const E164_PATTERN = /^\+?[1-9]\d{7,14}$/

export function validatePhoneNumber(phone) {
  if (!phone) return false
  return E164_PATTERN.test(String(phone).replace(/[\s-]/g, ''))
}

function isConfigured() {
  return Boolean(env.whatsapp.apiToken && env.whatsapp.phoneNumberId)
}

/**
 * Sends a WhatsApp message via the WhatsApp Cloud API.
 *
 * When credentials are not configured (env.whatsapp.apiToken/phoneNumberId
 * missing) this NEVER claims success — it logs the attempt and returns
 * { success: false, mocked: true }. The real Graph API call path below is
 * exercised only when real credentials are present; it has not been tested
 * against a live WhatsApp Business account in this environment.
 */
export async function sendWhatsAppMessage({ to, message }) {
  if (!validatePhoneNumber(to)) {
    console.error(`[whatsappService] Invalid recipient phone number: ${to}`)
    return { success: false, mocked: false, reason: 'invalid_phone_number' }
  }

  if (!isConfigured()) {
    console.log(`[whatsappService] Not configured. Would send WhatsApp message to ${to}: ${message}`)
    return { success: false, mocked: true, reason: 'not_configured' }
  }

  const url = `${env.whatsapp.apiBaseUrl}/${env.whatsapp.phoneNumberId}/messages`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsapp.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error(`[whatsappService] Provider error (${response.status}):`, body?.error?.message ?? 'unknown error')
      return { success: false, mocked: false, reason: 'provider_error', providerResponse: body }
    }

    return { success: true, mocked: false, providerResponse: body }
  } catch (error) {
    console.error('[whatsappService] Request failed:', error.message)
    return { success: false, mocked: false, reason: 'network_error' }
  }
}
