import { pool } from '../config/database.js'

export async function createActivity({ leadId, actorId, activityType, description, metadata }, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO lead_activities (lead_id, actor_id, activity_type, description, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, actorId ?? null, activityType, description ?? null, metadata ? JSON.stringify(metadata) : null]
  )
  return result.insertId
}

export async function listActivitiesByLead(leadId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT la.*, u.email AS actor_email
     FROM lead_activities la
     LEFT JOIN users u ON u.id = la.actor_id
     WHERE la.lead_id = ?
     ORDER BY la.created_at DESC`,
    [leadId]
  )
  return rows
}
