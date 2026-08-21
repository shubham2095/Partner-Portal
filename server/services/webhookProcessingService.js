import crypto from 'node:crypto'
import { findEventByExternalId, createEvent, markProcessed } from '../models/webhookEventModel.js'
import * as metaLeadAdsService from './metaLeadAdsService.js'
import * as googleLeadFormsService from './googleLeadFormsService.js'
import { createLeadFromExternalSource } from './leadIntegrationService.js'

function hashPayload(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32)
}

export async function processMetaWebhook(rawBody, signatureHeader) {
  const signatureValid = metaLeadAdsService.verifySignature(rawBody, signatureHeader)
  let payload

  try {
    payload = JSON.parse(rawBody.toString('utf8'))
  } catch {
    payload = null
  }

  if (!signatureValid) {
    const eventId = hashPayload(rawBody)
    const existing = await findEventByExternalId('META_LEAD_ADS', eventId)
    if (!existing) {
      const id = await createEvent({ provider: 'META_LEAD_ADS', externalEventId: eventId, signatureValid: false, payload: payload ?? {} })
      await markProcessed(id, { status: 'REJECTED', errorMessage: 'Invalid webhook signature' })
    }
    return { accepted: false, reason: 'invalid_signature' }
  }

  const leadgenEvents = payload ? metaLeadAdsService.extractLeadgenEvents(payload) : []
  const results = []

  for (const event of leadgenEvents) {
    const externalEventId = String(event.leadgen_id)
    const existing = await findEventByExternalId('META_LEAD_ADS', externalEventId)
    if (existing) {
      results.push({ leadgenId: externalEventId, status: 'DUPLICATE' })
      continue
    }

    const webhookEventId = await createEvent({
      provider: 'META_LEAD_ADS',
      externalEventId,
      signatureValid: true,
      payload: event,
    })

    const fieldDataResult = await metaLeadAdsService.fetchLeadFieldData(externalEventId)
    if (!fieldDataResult.success) {
      await markProcessed(webhookEventId, {
        status: 'REJECTED',
        errorMessage: `Could not retrieve lead field data (${fieldDataResult.reason})`,
      })
      results.push({ leadgenId: externalEventId, status: 'REJECTED', reason: fieldDataResult.reason })
      continue
    }

    const normalized = metaLeadAdsService.normalizeFieldData(fieldDataResult.data?.field_data)

    try {
      const { lead } = await createLeadFromExternalSource({
        source: 'META_LEAD_ADS',
        externalId: externalEventId,
        clientName: normalized.clientName,
        mobile: normalized.mobile,
        email: normalized.email,
      })
      await markProcessed(webhookEventId, { status: 'PROCESSED', createdLeadId: lead.id })
      results.push({ leadgenId: externalEventId, status: 'PROCESSED', leadId: lead.id })
    } catch (error) {
      await markProcessed(webhookEventId, { status: 'REJECTED', errorMessage: error.message })
      results.push({ leadgenId: externalEventId, status: 'REJECTED', reason: error.message })
    }
  }

  return { accepted: true, results }
}

export async function processGoogleWebhook(payload) {
  const rawKey = payload?.google_key
  const signatureValid = googleLeadFormsService.verifySharedKey(rawKey)

  if (!signatureValid) {
    // An unauthenticated caller controls payload.lead_id entirely, so it
    // must never share the dedup keyspace with authenticated events —
    // otherwise a bogus request could "poison" a lead_id and cause a
    // later legitimate submission with that same ID to be misread as a
    // duplicate. Log invalid attempts under a hash of the raw payload
    // instead, exactly like the Meta invalid-signature path.
    const invalidEventId = hashPayload(Buffer.from(JSON.stringify(payload ?? {})))
    const existing = await findEventByExternalId('GOOGLE_LEAD_FORMS', invalidEventId)
    if (!existing) {
      const id = await createEvent({
        provider: 'GOOGLE_LEAD_FORMS',
        externalEventId: invalidEventId,
        signatureValid: false,
        payload: payload ?? {},
      })
      await markProcessed(id, { status: 'REJECTED', errorMessage: 'Invalid or missing shared key' })
    }
    return { accepted: false, reason: 'invalid_signature' }
  }

  const externalEventId = payload?.lead_id ? String(payload.lead_id) : hashPayload(Buffer.from(JSON.stringify(payload ?? {})))
  const existing = await findEventByExternalId('GOOGLE_LEAD_FORMS', externalEventId)
  if (existing) {
    return { accepted: true, results: [{ leadId: externalEventId, status: 'DUPLICATE' }] }
  }

  const webhookEventId = await createEvent({
    provider: 'GOOGLE_LEAD_FORMS',
    externalEventId,
    signatureValid: true,
    payload,
  })

  const normalized = googleLeadFormsService.normalizeLeadPayload(payload)

  try {
    const { lead } = await createLeadFromExternalSource({
      source: 'GOOGLE_LEAD_FORMS',
      externalId: externalEventId,
      clientName: normalized.clientName,
      mobile: normalized.mobile,
      email: normalized.email,
    })
    await markProcessed(webhookEventId, { status: 'PROCESSED', createdLeadId: lead.id })
    return { accepted: true, results: [{ leadId: externalEventId, status: 'PROCESSED', createdLeadId: lead.id }] }
  } catch (error) {
    await markProcessed(webhookEventId, { status: 'REJECTED', errorMessage: error.message })
    return { accepted: true, results: [{ leadId: externalEventId, status: 'REJECTED', reason: error.message }] }
  }
}
