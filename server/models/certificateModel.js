import { pool } from '../config/database.js'

export async function createCertificate(
  { certificateNumber, freelancerId, testAttemptId, testId, webinarId, title, pdfPath },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO certificates
       (certificate_number, freelancer_id, test_attempt_id, test_id, webinar_id, title, pdf_path)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [certificateNumber, freelancerId, testAttemptId ?? null, testId ?? null, webinarId ?? null, title, pdfPath ?? null]
  )
  return result.insertId
}

export async function findCertificateById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM certificates WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function findCertificateByNumber(certificateNumber, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM certificates WHERE certificate_number = ? LIMIT 1', [
    certificateNumber,
  ])
  return rows[0] ?? null
}

export async function findCertificateByFreelancerAndTest(freelancerId, testId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM certificates WHERE freelancer_id = ? AND test_id = ? LIMIT 1',
    [freelancerId, testId]
  )
  return rows[0] ?? null
}

export async function listCertificatesByFreelancer(freelancerId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT c.*, t.title AS test_title, w.title AS webinar_title
     FROM certificates c
     LEFT JOIN tests t ON t.id = c.test_id
     LEFT JOIN webinars w ON w.id = c.webinar_id
     WHERE c.freelancer_id = ?
     ORDER BY c.issued_at DESC`,
    [freelancerId]
  )
  return rows
}

export async function listCertificates({ status, search, freelancerId, page = 1, limit = 20 }, executor = pool) {
  const conditions = []
  const params = []

  if (status) {
    conditions.push('c.status = ?')
    params.push(status)
  }

  if (freelancerId) {
    conditions.push('c.freelancer_id = ?')
    params.push(freelancerId)
  }

  if (search) {
    conditions.push('(c.certificate_number LIKE ? OR fp.full_name LIKE ? OR fp.partner_id LIKE ?)')
    const like = `%${search}%`
    params.push(like, like, like)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT c.*, fp.full_name, fp.partner_id
     FROM certificates c
     JOIN freelancer_profiles fp ON fp.id = c.freelancer_id
     ${whereClause}
     ORDER BY c.issued_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const [countRows] = await executor.query(
    `SELECT COUNT(*) AS total FROM certificates c JOIN freelancer_profiles fp ON fp.id = c.freelancer_id ${whereClause}`,
    params
  )

  return { rows, total: countRows[0].total }
}

export async function updateCertificateStatus(
  id,
  { status, revokedAt = null, revokedBy = null, revokeReason = null },
  executor = pool
) {
  await executor.query(
    'UPDATE certificates SET status = ?, revoked_at = ?, revoked_by = ?, revoke_reason = ? WHERE id = ?',
    [status, revokedAt, revokedBy, revokeReason, id]
  )
}

export async function updateCertificatePdfPath(id, pdfPath, executor = pool) {
  await executor.query('UPDATE certificates SET pdf_path = ? WHERE id = ?', [pdfPath, id])
}

export async function setCertificateNumber(id, certificateNumber, executor = pool) {
  await executor.query('UPDATE certificates SET certificate_number = ? WHERE id = ?', [certificateNumber, id])
}
