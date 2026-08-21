import { pool } from '../config/database.js'

export async function findPreferencesByUserId(userId, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM notification_preferences WHERE user_id = ? LIMIT 1', [userId])
  return rows[0] ?? null
}

export async function upsertPreferences(userId, { emailEnabled, whatsappEnabled }, executor = pool) {
  await executor.query(
    `INSERT INTO notification_preferences (user_id, email_enabled, whatsapp_enabled)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       email_enabled = VALUES(email_enabled),
       whatsapp_enabled = VALUES(whatsapp_enabled)`,
    [userId, emailEnabled ?? 1, whatsappEnabled ?? 1]
  )
  return findPreferencesByUserId(userId, executor)
}
