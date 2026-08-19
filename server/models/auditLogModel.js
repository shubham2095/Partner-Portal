import { pool } from '../config/database.js'

export async function createAuditLog(
  { actorId = null, action, entity, entityId = null, oldValue = null, newValue = null, ipAddress = null },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO audit_logs (actor_id, action, entity, entity_id, old_value, new_value, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      actorId,
      action,
      entity,
      entityId,
      oldValue === null ? null : JSON.stringify(oldValue),
      newValue === null ? null : JSON.stringify(newValue),
      ipAddress,
    ]
  )
  return result.insertId
}
