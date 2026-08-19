import { pool } from '../config/database.js'

const WEBINAR_FIELDS = [
  'title',
  'description',
  'speaker_name',
  'speaker_bio',
  'scheduled_at',
  'duration_minutes',
  'registration_url',
  'meeting_url',
  'recording_url',
  'training_material_url',
]

export async function createWebinar(
  { title, description, speakerName, speakerBio, scheduledAt, durationMinutes, registrationUrl, meetingUrl, recordingUrl, trainingMaterialUrl, createdBy },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO webinars
       (title, description, speaker_name, speaker_bio, scheduled_at, duration_minutes,
        registration_url, meeting_url, recording_url, training_material_url, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description ?? null,
      speakerName ?? null,
      speakerBio ?? null,
      scheduledAt,
      durationMinutes ?? null,
      registrationUrl ?? null,
      meetingUrl ?? null,
      recordingUrl ?? null,
      trainingMaterialUrl ?? null,
      createdBy,
    ]
  )
  return result.insertId
}

export async function findWebinarById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM webinars WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function updateWebinar(id, fields, executor = pool) {
  const entries = Object.entries(fields).filter(([key, value]) => WEBINAR_FIELDS.includes(key) && value !== undefined)
  if (entries.length === 0) return

  const setClause = entries.map(([key]) => `${key} = ?`).join(', ')
  const values = entries.map(([, value]) => value)
  await executor.query(`UPDATE webinars SET ${setClause} WHERE id = ?`, [...values, id])
}

export async function updateWebinarStatus(id, status, executor = pool) {
  await executor.query('UPDATE webinars SET status = ? WHERE id = ?', [status, id])
}

export async function listWebinars({ status, search, page = 1, limit = 20 }, executor = pool) {
  const conditions = []
  const params = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  if (search) {
    conditions.push('(title LIKE ? OR speaker_name LIKE ?)')
    const like = `%${search}%`
    params.push(like, like)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM webinars ${whereClause} ORDER BY scheduled_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM webinars ${whereClause}`, params)

  return { rows, total: countRows[0].total }
}

export async function listVisibleWebinars({ status, search, page = 1, limit = 20 }, executor = pool) {
  const conditions = ["status IN ('PUBLISHED','LIVE','COMPLETED')"]
  const params = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  if (search) {
    conditions.push('(title LIKE ? OR speaker_name LIKE ?)')
    const like = `%${search}%`
    params.push(like, like)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM webinars ${whereClause} ORDER BY scheduled_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM webinars ${whereClause}`, params)

  return { rows, total: countRows[0].total }
}
