import crypto from 'node:crypto'
import { env } from '../config/env.js'

/**
 * Google's lead form webhook authenticates via a shared secret embedded
 * in the JSON payload itself (google_key), not a header signature.
 * https://support.google.com/google-ads/answer/9427086
 */
export function verifySharedKey(payloadGoogleKey) {
  if (!env.googleLeadForms.sharedKey || !payloadGoogleKey) return false

  const provided = Buffer.from(String(payloadGoogleKey))
  const expected = Buffer.from(env.googleLeadForms.sharedKey)
  if (provided.length !== expected.length) return false
  return crypto.timingSafeEqual(provided, expected)
}

/**
 * Normalizes Google's user_column_data array
 * ([{ column_id | column_name, string_value }]) into our lead shape.
 */
export function normalizeLeadPayload(payload) {
  const columns = payload?.user_column_data ?? []
  const map = new Map(
    columns.map((column) => [(column.column_id ?? column.column_name ?? '').toUpperCase(), column.string_value])
  )

  return {
    externalId: String(payload?.lead_id ?? ''),
    clientName: map.get('FULL_NAME') ?? map.get('FIRST_NAME') ?? 'Unknown',
    email: map.get('EMAIL') ?? null,
    mobile: map.get('PHONE_NUMBER') ?? null,
  }
}
