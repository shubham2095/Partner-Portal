import { pool } from '../config/database.js'

// PDF §22.7 category set — Part 5's original 8 labels were remapped onto
// these 7 in migration 0053 (existing tickets preserved, not dropped).
export const TICKET_CATEGORIES = [
  'LEAD_ISSUE',
  'COMMISSION_ISSUE',
  'PAYMENT_WITHDRAWAL',
  'COURSE_TRAINING',
  'TECHNICAL_ISSUE',
  'PROFILE_ACCOUNT',
  'GENERAL_QUERY',
]
export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
// PDF §22.12 lifecycle — ASSIGNED and WAITING_FOR_FREELANCER added in
// migration 0053 alongside Part 5's original 4 statuses.
export const TICKET_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_FREELANCER', 'RESOLVED', 'CLOSED']

const TICKET_NUMBER_PREFIX = 'TKT-'
const TICKET_NUMBER_PADDING = 6

export function formatTicketNumber(id) {
  return `${TICKET_NUMBER_PREFIX}${String(id).padStart(TICKET_NUMBER_PADDING, '0')}`
}

export async function createTicket(
  { freelancerId, category, subject, description, priority },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO tickets (freelancer_id, category, subject, description, priority)
     VALUES (?, ?, ?, ?, ?)`,
    [freelancerId, category, subject, description, priority ?? 'MEDIUM']
  )
  return result.insertId
}

export async function setTicketNumber(id, ticketNumber, executor = pool) {
  await executor.query('UPDATE tickets SET ticket_number = ? WHERE id = ?', [ticketNumber, id])
}

export async function findTicketById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM tickets WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function findTicketByIdForUpdate(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM tickets WHERE id = ? LIMIT 1 FOR UPDATE', [id])
  return rows[0] ?? null
}

export async function findTicketDetailById(id, executor = pool) {
  const [rows] = await executor.query(
    `SELECT t.*, fp.full_name AS freelancer_name, fp.partner_id, admin.email AS assigned_admin_email
     FROM tickets t
     INNER JOIN freelancer_profiles fp ON fp.id = t.freelancer_id
     LEFT JOIN users admin ON admin.id = t.assigned_admin_id
     WHERE t.id = ? LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}

export async function updateTicketAssignment(id, assignedAdminId, executor = pool) {
  await executor.query('UPDATE tickets SET assigned_admin_id = ? WHERE id = ?', [assignedAdminId, id])
}

export async function updateTicketPriority(id, priority, executor = pool) {
  await executor.query('UPDATE tickets SET priority = ? WHERE id = ?', [priority, id])
}

// resolvedAt/closedAt: undefined leaves the existing column value alone
// (used when closing a ticket that was already resolved, so the original
// resolution time isn't lost); null explicitly clears it; a Date sets it.
export async function updateTicketStatus(id, { status, resolvedAt, closedAt }, executor = pool) {
  const setClauses = ['status = ?']
  const params = [status]
  if (resolvedAt !== undefined) {
    setClauses.push('resolved_at = ?')
    params.push(resolvedAt)
  }
  if (closedAt !== undefined) {
    setClauses.push('closed_at = ?')
    params.push(closedAt)
  }
  params.push(id)
  await executor.query(`UPDATE tickets SET ${setClauses.join(', ')} WHERE id = ?`, params)
}

export async function listTicketsAdmin(
  { status, category, priority, assignedAdminId, freelancerId, search, page = 1, limit = 20 },
  executor = pool
) {
  const conditions = []
  const params = []

  if (status) {
    conditions.push('t.status = ?')
    params.push(status)
  }
  if (category) {
    conditions.push('t.category = ?')
    params.push(category)
  }
  if (priority) {
    conditions.push('t.priority = ?')
    params.push(priority)
  }
  if (assignedAdminId) {
    conditions.push('t.assigned_admin_id = ?')
    params.push(assignedAdminId)
  }
  if (freelancerId) {
    conditions.push('t.freelancer_id = ?')
    params.push(freelancerId)
  }
  if (search) {
    conditions.push('(t.subject LIKE ? OR t.ticket_number LIKE ? OR fp.full_name LIKE ?)')
    const like = `%${search}%`
    params.push(like, like, like)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT t.*, fp.full_name AS freelancer_name, fp.partner_id, admin.email AS assigned_admin_email
     FROM tickets t
     INNER JOIN freelancer_profiles fp ON fp.id = t.freelancer_id
     LEFT JOIN users admin ON admin.id = t.assigned_admin_id
     ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(
    `SELECT COUNT(*) AS total FROM tickets t INNER JOIN freelancer_profiles fp ON fp.id = t.freelancer_id ${whereClause}`,
    params
  )

  return { rows, total: countRows[0].total }
}

export async function listTicketsForFreelancer(
  { freelancerId, status, category, priority, search, page = 1, limit = 20 },
  executor = pool
) {
  const conditions = ['freelancer_id = ?']
  const params = [freelancerId]

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }
  if (category) {
    conditions.push('category = ?')
    params.push(category)
  }
  if (priority) {
    conditions.push('priority = ?')
    params.push(priority)
  }
  if (search) {
    conditions.push('(subject LIKE ? OR ticket_number LIKE ?)')
    const like = `%${search}%`
    params.push(like, like)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM tickets ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM tickets ${whereClause}`, params)

  return { rows, total: countRows[0].total }
}

export async function getTicketCountsByStatus(freelancerId, executor = pool) {
  const conditions = freelancerId ? 'WHERE freelancer_id = ?' : ''
  const params = freelancerId ? [freelancerId] : []
  const [rows] = await executor.query(
    `SELECT status, COUNT(*) AS count FROM tickets ${conditions} GROUP BY status`,
    params
  )
  return rows
}

export async function getUnassignedOpenCount(executor = pool) {
  const [rows] = await executor.query(
    "SELECT COUNT(*) AS count FROM tickets WHERE assigned_admin_id IS NULL AND status IN ('OPEN','IN_PROGRESS')"
  )
  return rows[0].count
}

export async function getHighPriorityOpenCount(executor = pool) {
  const [rows] = await executor.query(
    "SELECT COUNT(*) AS count FROM tickets WHERE priority IN ('HIGH','URGENT') AND status IN ('OPEN','IN_PROGRESS')"
  )
  return rows[0].count
}

// ---- Messages ----

export async function createTicketMessage({ ticketId, senderUserId, senderRole, message }, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO ticket_messages (ticket_id, sender_user_id, sender_role, message) VALUES (?, ?, ?, ?)`,
    [ticketId, senderUserId, senderRole, message]
  )
  return result.insertId
}

export async function listMessagesByTicket(ticketId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT m.*, u.email AS sender_email
     FROM ticket_messages m
     INNER JOIN users u ON u.id = m.sender_user_id
     WHERE m.ticket_id = ?
     ORDER BY m.created_at ASC`,
    [ticketId]
  )
  return rows
}

// ---- Attachments ----

export async function createTicketAttachment(
  { ticketId, messageId, uploadedBy, originalFilename, filePath, mimeType, fileSize },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO ticket_attachments (ticket_id, message_id, uploaded_by, original_filename, file_path, mime_type, file_size)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ticketId, messageId ?? null, uploadedBy, originalFilename, filePath, mimeType, fileSize]
  )
  return result.insertId
}

export async function listAttachmentsByTicket(ticketId, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM ticket_attachments WHERE ticket_id = ? ORDER BY created_at ASC', [
    ticketId,
  ])
  return rows
}

export async function findAttachmentById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM ticket_attachments WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}
