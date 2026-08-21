import { pool } from '../config/database.js'

const LEAD_FIELDS = [
  'client_name',
  'company',
  'mobile',
  'email',
  'location',
  'business_category',
  'service_interested',
  'source',
  'lead_date',
  'expected_value',
  'notes',
]

export async function createLead(
  {
    clientName,
    company,
    mobile,
    email,
    location,
    businessCategory,
    serviceInterested,
    source,
    leadDate,
    expectedValue,
    notes,
    createdBy,
  },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO leads
       (client_name, company, mobile, email, location, business_category, service_interested,
        source, lead_date, expected_value, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clientName,
      company ?? null,
      mobile,
      email ?? null,
      location ?? null,
      businessCategory ?? null,
      serviceInterested ?? null,
      source ?? null,
      leadDate ?? new Date().toISOString().slice(0, 10),
      expectedValue ?? null,
      notes ?? null,
      createdBy,
    ]
  )
  return result.insertId
}

export async function createExternalLead(
  {
    clientName,
    mobile,
    email,
    serviceInterested,
    businessCategory,
    externalSource,
    externalId,
    notes,
  },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO leads
       (client_name, mobile, email, service_interested, business_category, source, external_source, external_id,
        lead_date, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      clientName,
      mobile,
      email ?? null,
      serviceInterested ?? null,
      businessCategory ?? null,
      externalSource,
      externalSource,
      externalId,
      new Date().toISOString().slice(0, 10),
      notes ?? null,
    ]
  )
  return result.insertId
}

export async function findLeadByExternalId(externalSource, externalId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM leads WHERE external_source = ? AND external_id = ? LIMIT 1',
    [externalSource, externalId]
  )
  return rows[0] ?? null
}

export async function setLeadNumber(id, leadNumber, executor = pool) {
  await executor.query('UPDATE leads SET lead_number = ? WHERE id = ?', [leadNumber, id])
}

export async function findLeadById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM leads WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function findLeadDetailById(id, executor = pool) {
  const [rows] = await executor.query(
    `SELECT l.*, fp.full_name AS assigned_freelancer_name, fp.partner_id AS assigned_partner_id,
            creator.email AS created_by_email
     FROM leads l
     LEFT JOIN freelancer_profiles fp ON fp.id = l.assigned_freelancer_id
     LEFT JOIN users creator ON creator.id = l.created_by
     WHERE l.id = ? LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}

export async function findLeadByIdForUpdate(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM leads WHERE id = ? LIMIT 1 FOR UPDATE', [id])
  return rows[0] ?? null
}

export async function updateLead(id, fields, executor = pool) {
  const entries = Object.entries(fields).filter(([key, value]) => LEAD_FIELDS.includes(key) && value !== undefined)
  if (entries.length === 0) return
  const setClause = entries.map(([key]) => `${key} = ?`).join(', ')
  const values = entries.map(([, value]) => value)
  await executor.query(`UPDATE leads SET ${setClause} WHERE id = ?`, [...values, id])
}

export async function updateLeadStatus(id, { status, conversionValue }, executor = pool) {
  await executor.query('UPDATE leads SET status = ?, conversion_value = COALESCE(?, conversion_value) WHERE id = ?', [
    status,
    conversionValue ?? null,
    id,
  ])
}

export async function updateLeadAssignment(id, freelancerId, executor = pool) {
  await executor.query('UPDATE leads SET assigned_freelancer_id = ? WHERE id = ?', [freelancerId, id])
}

export async function recomputeLeadFollowUpDate(id, executor = pool) {
  await executor.query(
    `UPDATE leads
     SET follow_up_date = (
       SELECT MIN(scheduled_at) FROM follow_ups WHERE lead_id = ? AND status = 'PENDING'
     )
     WHERE id = ?`,
    [id, id]
  )
}

function buildLeadFilters({ status, source, assignedFreelancerId, unassigned, search }) {
  const conditions = []
  const params = []

  if (status) {
    conditions.push('l.status = ?')
    params.push(status)
  }
  if (source) {
    conditions.push('l.source = ?')
    params.push(source)
  }
  if (unassigned) {
    conditions.push('l.assigned_freelancer_id IS NULL')
  } else if (assignedFreelancerId) {
    conditions.push('l.assigned_freelancer_id = ?')
    params.push(assignedFreelancerId)
  }
  if (search) {
    conditions.push(
      '(l.client_name LIKE ? OR l.company LIKE ? OR l.mobile LIKE ? OR l.email LIKE ? OR l.lead_number LIKE ?)'
    )
    const like = `%${search}%`
    params.push(like, like, like, like, like)
  }

  return { conditions, params }
}

const SORTABLE_COLUMNS = new Set(['created_at', 'lead_date', 'expected_value', 'status', 'follow_up_date', 'client_name'])

export async function listLeadsAdmin(
  { status, source, assignedFreelancerId, unassigned, search, sortBy = 'created_at', sortDir = 'DESC', page = 1, limit = 20 },
  executor = pool
) {
  const { conditions, params } = buildLeadFilters({ status, source, assignedFreelancerId, unassigned, search })
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const orderColumn = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'created_at'
  const orderDir = sortDir === 'ASC' ? 'ASC' : 'DESC'
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT l.*, fp.full_name AS assigned_freelancer_name, fp.partner_id AS assigned_partner_id
     FROM leads l
     LEFT JOIN freelancer_profiles fp ON fp.id = l.assigned_freelancer_id
     ${whereClause}
     ORDER BY l.${orderColumn} ${orderDir}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM leads l ${whereClause}`, params)

  return { rows, total: countRows[0].total }
}

export async function listLeadsForFreelancer(
  { freelancerId, status, search, sortBy = 'created_at', sortDir = 'DESC', page = 1, limit = 20 },
  executor = pool
) {
  const { conditions, params } = buildLeadFilters({ status, search, assignedFreelancerId: freelancerId })
  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const orderColumn = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'created_at'
  const orderDir = sortDir === 'ASC' ? 'ASC' : 'DESC'
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM leads l ${whereClause} ORDER BY l.${orderColumn} ${orderDir} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM leads l ${whereClause}`, params)

  return { rows, total: countRows[0].total }
}

export const LEAD_STATUSES = [
  'NEW',
  'CONTACT_ATTEMPTED',
  'CONTACTED',
  'INTERESTED',
  'MEETING_SCHEDULED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'FOLLOW_UP',
  'CONVERTED',
  'NOT_INTERESTED',
  'WRONG_NUMBER',
  'LOST',
  'FUTURE_OPPORTUNITY',
]

export const TERMINAL_STATUSES = new Set(['CONVERTED', 'LOST'])
