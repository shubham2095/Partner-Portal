import { pool } from '../config/database.js'

export async function createRegistration({ webinarId, freelancerId, source, campaign }, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO webinar_registrations (webinar_id, freelancer_id, source, campaign)
     VALUES (?, ?, ?, ?)`,
    [webinarId, freelancerId, source ?? null, campaign ?? null]
  )
  return result.insertId
}

export async function findRegistrationById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM webinar_registrations WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function findRegistration(webinarId, freelancerId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM webinar_registrations WHERE webinar_id = ? AND freelancer_id = ? LIMIT 1',
    [webinarId, freelancerId]
  )
  return rows[0] ?? null
}

export async function updateRegistrationStatus(id, status, executor = pool) {
  await executor.query('UPDATE webinar_registrations SET status = ? WHERE id = ?', [status, id])
}

export async function listRegistrationsByFreelancer(freelancerId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT wr.*, w.title, w.scheduled_at, w.status AS webinar_status
     FROM webinar_registrations wr
     JOIN webinars w ON w.id = wr.webinar_id
     WHERE wr.freelancer_id = ?
     ORDER BY w.scheduled_at DESC`,
    [freelancerId]
  )
  return rows
}

export async function listRegistrationsByWebinar({ webinarId, status, search, page = 1, limit = 20 }, executor = pool) {
  const conditions = ['wr.webinar_id = ?']
  const params = [webinarId]

  if (status) {
    conditions.push('wr.status = ?')
    params.push(status)
  }

  if (search) {
    conditions.push('(fp.full_name LIKE ? OR fp.partner_id LIKE ?)')
    const like = `%${search}%`
    params.push(like, like)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT wr.*, fp.full_name, fp.partner_id, u.email AS freelancer_email
     FROM webinar_registrations wr
     JOIN freelancer_profiles fp ON fp.id = wr.freelancer_id
     JOIN users u ON u.id = fp.user_id
     ${whereClause}
     ORDER BY wr.registration_date DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const [countRows] = await executor.query(
    `SELECT COUNT(*) AS total
     FROM webinar_registrations wr
     JOIN freelancer_profiles fp ON fp.id = wr.freelancer_id
     ${whereClause}`,
    params
  )

  return { rows, total: countRows[0].total }
}

export async function getRegistrationStats(webinarId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT status, COUNT(*) AS count FROM webinar_registrations WHERE webinar_id = ? GROUP BY status`,
    [webinarId]
  )
  return rows
}
