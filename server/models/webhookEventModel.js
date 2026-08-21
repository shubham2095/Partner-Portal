import { pool } from '../config/database.js'

export async function findEventByExternalId(provider, externalEventId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM webhook_events WHERE provider = ? AND external_event_id = ? LIMIT 1',
    [provider, externalEventId]
  )
  return rows[0] ?? null
}

export async function createEvent({ provider, externalEventId, signatureValid, payload }, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO webhook_events (provider, external_event_id, signature_valid, payload)
     VALUES (?, ?, ?, ?)`,
    [provider, externalEventId, signatureValid ? 1 : 0, JSON.stringify(payload)]
  )
  return result.insertId
}

export async function markProcessed(id, { status, createdLeadId, errorMessage }, executor = pool) {
  await executor.query(
    `UPDATE webhook_events
     SET processing_status = ?, created_lead_id = ?, error_message = ?, processed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, createdLeadId ?? null, errorMessage ?? null, id]
  )
}

export async function listEvents({ provider, status, page = 1, limit = 20 }, executor = pool) {
  const conditions = []
  const params = []
  if (provider) {
    conditions.push('provider = ?')
    params.push(provider)
  }
  if (status) {
    conditions.push('processing_status = ?')
    params.push(status)
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM webhook_events ${whereClause} ORDER BY received_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM webhook_events ${whereClause}`, params)
  return { rows, total: countRows[0].total }
}
