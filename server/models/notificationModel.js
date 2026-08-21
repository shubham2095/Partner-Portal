import { pool } from '../config/database.js'

export async function createNotification(
  { recipientUserId, type, title, message, relatedEntityType, relatedEntityId },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO notifications (recipient_user_id, type, title, message, related_entity_type, related_entity_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [recipientUserId, type, title, message ?? null, relatedEntityType ?? null, relatedEntityId ?? null]
  )
  return result.insertId
}

export async function findNotificationById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function listNotificationsForUser({ userId, unreadOnly, page = 1, limit = 20 }, executor = pool) {
  const conditions = ['recipient_user_id = ?']
  const params = [userId]
  if (unreadOnly) {
    conditions.push('read_at IS NULL')
  }
  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM notifications ${whereClause}`, params)
  return { rows, total: countRows[0].total }
}

export async function countUnread(userId, executor = pool) {
  const [[row]] = await executor.query(
    'SELECT COUNT(*) AS count FROM notifications WHERE recipient_user_id = ? AND read_at IS NULL',
    [userId]
  )
  return row.count
}

export async function markAsRead(id, userId, executor = pool) {
  await executor.query(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND recipient_user_id = ? AND read_at IS NULL',
    [id, userId]
  )
}

export async function markAllAsRead(userId, executor = pool) {
  await executor.query(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE recipient_user_id = ? AND read_at IS NULL',
    [userId]
  )
}

export async function listAdminUserIds(executor = pool) {
  const [rows] = await executor.query("SELECT id FROM users WHERE role IN ('ADMIN','SUPER_ADMIN') AND is_active = 1")
  return rows.map((row) => row.id)
}
