import crypto from 'node:crypto'
import { env } from '../config/env.js'

/**
 * Verifies Meta's X-Hub-Signature-256 header: HMAC-SHA256 of the raw
 * request body, keyed with the app secret, formatted "sha256=<hex>".
 * Requires the raw (unparsed) request body — see routes/webhook.routes.js.
 */
export function verifySignature(rawBody, signatureHeader) {
  if (!env.metaLeadAds.appSecret || !signatureHeader) return false

  const expected =
    'sha256=' + crypto.createHmac('sha256', env.metaLeadAds.appSecret).update(rawBody).digest('hex')

  const provided = Buffer.from(signatureHeader)
  const expectedBuf = Buffer.from(expected)
  if (provided.length !== expectedBuf.length) return false
  return crypto.timingSafeEqual(provided, expectedBuf)
}

/** Meta's webhook subscription handshake (GET request with hub.* query params). */
export function verifySubscriptionChallenge({ mode, verifyToken, challenge }) {
  if (mode === 'subscribe' && verifyToken && env.metaLeadAds.verifyToken && verifyToken === env.metaLeadAds.verifyToken) {
    return challenge
  }
  return null
}

/**
 * Extracts the leadgen change entries from a Meta webhook payload.
 * Payload shape: { entry: [{ changes: [{ field: 'leadgen', value: { leadgen_id, form_id, page_id, ... } }] }] }
 */
export function extractLeadgenEvents(payload) {
  const events = []
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      if (change.field === 'leadgen' && change.value?.leadgen_id) {
        events.push(change.value)
      }
    }
  }
  return events
}

/**
 * Fetches the actual submitted field data for a lead from the Graph API.
 * Meta's webhook only carries the leadgen_id — the field values require
 * this follow-up call with a page access token.
 *
 * Not testable without a live Meta Page/App — returns a clear
 * "not configured" result rather than fabricating field data.
 */
export async function fetchLeadFieldData(leadgenId) {
  if (!env.metaLeadAds.pageAccessToken) {
    console.log(`[metaLeadAdsService] Not configured. Cannot fetch field data for leadgen_id ${leadgenId}.`)
    return { success: false, mocked: true, reason: 'not_configured' }
  }

  const url = `${env.metaLeadAds.graphApiBaseUrl}/${leadgenId}?access_token=${env.metaLeadAds.pageAccessToken}`

  try {
    const response = await fetch(url)
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      console.error('[metaLeadAdsService] Graph API error:', body?.error?.message ?? 'unknown error')
      return { success: false, mocked: false, reason: 'provider_error' }
    }
    return { success: true, mocked: false, data: body }
  } catch (error) {
    console.error('[metaLeadAdsService] Graph API request failed:', error.message)
    return { success: false, mocked: false, reason: 'network_error' }
  }
}

/** Normalizes Graph API field_data (array of {name, values}) into our lead shape. */
export function normalizeFieldData(fieldData = []) {
  const map = new Map(fieldData.map((field) => [field.name?.toLowerCase(), field.values?.[0]]))
  return {
    clientName: map.get('full_name') ?? map.get('first_name') ?? 'Unknown',
    email: map.get('email') ?? null,
    mobile: map.get('phone_number') ?? map.get('phone') ?? null,
  }
}
