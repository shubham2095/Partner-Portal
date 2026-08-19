import { pool } from '../config/database.js'

const PROFESSIONAL_FIELDS = [
  'full_name',
  'mobile',
  'location',
  'date_of_birth',
  'current_occupation',
  'total_experience_years',
  'digital_marketing_experience',
  'sales_experience',
  'skills',
  'specializations',
  'preferred_working_areas',
  'previous_agency_experience',
]

export async function createFreelancerProfile({ userId, fullName, mobile }, executor = pool) {
  const [result] = await executor.query(
    'INSERT INTO freelancer_profiles (user_id, full_name, mobile) VALUES (?, ?, ?)',
    [userId, fullName, mobile]
  )
  return result.insertId
}

export async function setPartnerId(id, partnerId, executor = pool) {
  await executor.query('UPDATE freelancer_profiles SET partner_id = ? WHERE id = ?', [partnerId, id])
}

export async function findProfileByUserId(userId, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM freelancer_profiles WHERE user_id = ? LIMIT 1', [userId])
  return rows[0] ?? null
}

export async function findProfileById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM freelancer_profiles WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function findProfileDetailById(id, executor = pool) {
  const [rows] = await executor.query(
    `SELECT fp.*, u.email, u.is_active, u.email_verified_at, u.last_login_at,
            verifier.email AS verified_by_email
     FROM freelancer_profiles fp
     JOIN users u ON u.id = fp.user_id
     LEFT JOIN users verifier ON verifier.id = fp.verified_by
     WHERE fp.id = ?
     LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}

export async function updateProfessionalDetails(id, fields, executor = pool) {
  const entries = Object.entries(fields).filter(
    ([key, value]) => PROFESSIONAL_FIELDS.includes(key) && value !== undefined
  )
  if (entries.length === 0) return

  const setClause = entries.map(([key]) => `${key} = ?`).join(', ')
  const values = entries.map(([, value]) => value)
  await executor.query(`UPDATE freelancer_profiles SET ${setClause} WHERE id = ?`, [...values, id])
}

export async function updateProfilePhoto(id, profilePhotoPath, executor = pool) {
  await executor.query('UPDATE freelancer_profiles SET profile_photo_path = ? WHERE id = ?', [
    profilePhotoPath,
    id,
  ])
}

export async function updateProfileStatus(
  id,
  { status, rejectionReason = null, verifiedBy = null, verifiedAt = null },
  executor = pool
) {
  await executor.query(
    'UPDATE freelancer_profiles SET status = ?, rejection_reason = ?, verified_by = ?, verified_at = ? WHERE id = ?',
    [status, rejectionReason, verifiedBy, verifiedAt, id]
  )
}

export async function listProfiles({ status, search, page = 1, limit = 20 }, executor = pool) {
  const conditions = []
  const params = []

  if (status) {
    conditions.push('fp.status = ?')
    params.push(status)
  }

  if (search) {
    conditions.push('(fp.full_name LIKE ? OR fp.partner_id LIKE ? OR u.email LIKE ?)')
    const like = `%${search}%`
    params.push(like, like, like)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT fp.id, fp.user_id, fp.partner_id, fp.full_name, fp.mobile, fp.location, fp.status,
            fp.created_at, u.email, u.is_active
     FROM freelancer_profiles fp
     JOIN users u ON u.id = fp.user_id
     ${whereClause}
     ORDER BY fp.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const [countRows] = await executor.query(
    `SELECT COUNT(*) AS total FROM freelancer_profiles fp JOIN users u ON u.id = fp.user_id ${whereClause}`,
    params
  )

  return { rows, total: countRows[0].total }
}
