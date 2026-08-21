import { pool } from '../config/database.js'

export async function createDelivery({ notificationId, channel, status, providerResponse, errorMessage }, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO notification_deliveries (notification_id, channel, status, provider_response, error_message, delivered_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      notificationId,
      channel,
      status,
      providerResponse ?? null,
      errorMessage ?? null,
      status === 'SENT' ? new Date() : null,
    ]
  )
  return result.insertId
}

export async function listDeliveriesByNotification(notificationId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM notification_deliveries WHERE notification_id = ? ORDER BY attempted_at DESC',
    [notificationId]
  )
  return rows
}
