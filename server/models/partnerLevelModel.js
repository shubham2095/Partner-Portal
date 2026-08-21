import { pool } from '../config/database.js'

export async function updatePartnerLevel(freelancerId, level, executor = pool) {
  await executor.query('UPDATE freelancer_profiles SET partner_level = ? WHERE id = ?', [level, freelancerId])
}

export async function createLevelHistory(
  { freelancerId, previousLevel, newLevel, changedBy, reason },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO partner_level_history (freelancer_id, previous_level, new_level, changed_by, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [freelancerId, previousLevel ?? null, newLevel, changedBy, reason ?? null]
  )
  return result.insertId
}

export async function listLevelHistory(freelancerId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT plh.*, u.email AS changed_by_email
     FROM partner_level_history plh
     LEFT JOIN users u ON u.id = plh.changed_by
     WHERE plh.freelancer_id = ?
     ORDER BY plh.created_at DESC`,
    [freelancerId]
  )
  return rows
}
