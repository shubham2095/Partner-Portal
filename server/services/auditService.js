import { createAuditLog } from '../models/auditLogModel.js'

export async function logAudit({ actorId, action, entity, entityId, oldValue = null, newValue = null, req }) {
  await createAuditLog({
    actorId,
    action,
    entity,
    entityId,
    oldValue,
    newValue,
    ipAddress: req?.ip ?? null,
  })
}
