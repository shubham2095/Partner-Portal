import { pool } from '../config/database.js'

export async function createFollowUp(
  { leadId, scheduledAt, followUpType, priority, notes, createdBy },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO follow_ups (lead_id, scheduled_at, follow_up_type, priority, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [leadId, scheduledAt, followUpType, priority ?? 'MEDIUM', notes ?? null, createdBy]
  )
  return result.insertId
}

export async function findFollowUpById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM follow_ups WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function findFollowUpsDueForReminder(windowMinutes, executor = pool) {
  const [rows] = await executor.query(
    `SELECT fu.*, l.assigned_freelancer_id, l.client_name AS lead_client_name, l.lead_number, fp.user_id
     FROM follow_ups fu
     INNER JOIN leads l ON l.id = fu.lead_id
     LEFT JOIN freelancer_profiles fp ON fp.id = l.assigned_freelancer_id
     WHERE fu.status = 'PENDING'
       AND fu.reminder_sent_at IS NULL
       AND fu.scheduled_at <= DATE_ADD(NOW(), INTERVAL ? MINUTE)
       AND l.assigned_freelancer_id IS NOT NULL`,
    [windowMinutes]
  )
  return rows
}

export async function markReminderSent(id, executor = pool) {
  const [result] = await executor.query(
    "UPDATE follow_ups SET reminder_sent_at = NOW() WHERE id = ? AND reminder_sent_at IS NULL",
    [id]
  )
  return result.affectedRows > 0
}

export async function findFollowUpWithLead(id, executor = pool) {
  const [rows] = await executor.query(
    `SELECT fu.*, l.assigned_freelancer_id, l.client_name AS lead_client_name
     FROM follow_ups fu
     INNER JOIN leads l ON l.id = fu.lead_id
     WHERE fu.id = ? LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}

const FOLLOWUP_FIELDS = ['scheduled_at', 'follow_up_type', 'priority', 'notes']

export async function updateFollowUp(id, fields, executor = pool) {
  const entries = Object.entries(fields).filter(([key, value]) => FOLLOWUP_FIELDS.includes(key) && value !== undefined)
  if (entries.length === 0) return
  const setClause = entries.map(([key]) => `${key} = ?`).join(', ')
  const values = entries.map(([, value]) => value)
  await executor.query(`UPDATE follow_ups SET ${setClause} WHERE id = ?`, [...values, id])
}

export async function completeFollowUp(id, { outcome, nextFollowUpDate }, executor = pool) {
  await executor.query(
    `UPDATE follow_ups
     SET status = 'COMPLETED', outcome = ?, next_follow_up_date = ?, completed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [outcome ?? null, nextFollowUpDate ?? null, id]
  )
}

export async function cancelFollowUp(id, executor = pool) {
  await executor.query("UPDATE follow_ups SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP WHERE id = ?", [id])
}

export async function listFollowUpsByLead(leadId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT fu.*, u.email AS created_by_email
     FROM follow_ups fu
     LEFT JOIN users u ON u.id = fu.created_by
     WHERE fu.lead_id = ?
     ORDER BY fu.scheduled_at DESC`,
    [leadId]
  )
  return rows
}

function applyBucketCondition(bucket, conditions, params) {
  if (!bucket) return
  conditions.push("fu.status = 'PENDING'")
  if (bucket === 'overdue') {
    conditions.push('fu.scheduled_at < NOW()')
  } else if (bucket === 'today') {
    conditions.push('DATE(fu.scheduled_at) = CURDATE()')
  } else if (bucket === 'tomorrow') {
    conditions.push('DATE(fu.scheduled_at) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)')
  } else if (bucket === 'upcoming') {
    conditions.push('DATE(fu.scheduled_at) > DATE_ADD(CURDATE(), INTERVAL 1 DAY)')
  }
}

// Shared by the admin and freelancer list queries — kept as one function so
// the two follow-up listing endpoints can't silently drift apart.
function applyCommonFilters({ followUpType, priority, search }, conditions, params) {
  if (followUpType) {
    conditions.push('fu.follow_up_type = ?')
    params.push(followUpType)
  }
  if (priority) {
    conditions.push('fu.priority = ?')
    params.push(priority)
  }
  if (search) {
    conditions.push('(l.client_name LIKE ? OR l.lead_number LIKE ?)')
    const like = `%${search}%`
    params.push(like, like)
  }
}

export async function listFollowUpsAdmin(
  { bucket, status, assignedFreelancerId, followUpType, priority, search, page = 1, limit = 20 },
  executor = pool
) {
  const conditions = []
  const params = []

  applyBucketCondition(bucket, conditions, params)
  if (!bucket && status) {
    conditions.push('fu.status = ?')
    params.push(status)
  }
  if (assignedFreelancerId) {
    conditions.push('l.assigned_freelancer_id = ?')
    params.push(assignedFreelancerId)
  }
  applyCommonFilters({ followUpType, priority, search }, conditions, params)

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT fu.*, l.lead_number, l.client_name, l.assigned_freelancer_id, fp.full_name AS assigned_freelancer_name
     FROM follow_ups fu
     INNER JOIN leads l ON l.id = fu.lead_id
     LEFT JOIN freelancer_profiles fp ON fp.id = l.assigned_freelancer_id
     ${whereClause}
     ORDER BY fu.scheduled_at ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(
    `SELECT COUNT(*) AS total FROM follow_ups fu INNER JOIN leads l ON l.id = fu.lead_id ${whereClause}`,
    params
  )

  return { rows, total: countRows[0].total }
}

export async function listFollowUpsForFreelancer(
  { freelancerId, bucket, status, followUpType, priority, search, page = 1, limit = 20 },
  executor = pool
) {
  const conditions = ['l.assigned_freelancer_id = ?']
  const params = [freelancerId]

  applyBucketCondition(bucket, conditions, params)
  if (!bucket && status) {
    conditions.push('fu.status = ?')
    params.push(status)
  }
  applyCommonFilters({ followUpType, priority, search }, conditions, params)

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT fu.*, l.lead_number, l.client_name
     FROM follow_ups fu
     INNER JOIN leads l ON l.id = fu.lead_id
     ${whereClause}
     ORDER BY fu.scheduled_at ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(
    `SELECT COUNT(*) AS total FROM follow_ups fu INNER JOIN leads l ON l.id = fu.lead_id ${whereClause}`,
    params
  )

  return { rows, total: countRows[0].total }
}
