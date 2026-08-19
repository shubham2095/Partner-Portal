import { pool } from '../config/database.js'

const TRAINING_FIELDS = [
  'category_id',
  'title',
  'description',
  'thumbnail_url',
  'access_level',
]

export async function createTraining(
  { categoryId, title, description, thumbnailUrl, accessLevel, createdBy },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO trainings (category_id, title, description, thumbnail_url, access_level, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [categoryId ?? null, title, description ?? null, thumbnailUrl ?? null, accessLevel ?? 'ALL', createdBy]
  )
  return result.insertId
}

export async function findTrainingById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM trainings WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function updateTraining(id, fields, executor = pool) {
  const entries = Object.entries(fields).filter(([key, value]) => TRAINING_FIELDS.includes(key) && value !== undefined)
  if (entries.length === 0) return
  const setClause = entries.map(([key]) => `${key} = ?`).join(', ')
  const values = entries.map(([, value]) => value)
  await executor.query(`UPDATE trainings SET ${setClause} WHERE id = ?`, [...values, id])
}

export async function updateTrainingStatus(id, status, executor = pool) {
  await executor.query('UPDATE trainings SET status = ? WHERE id = ?', [status, id])
}

export async function recomputeTrainingTotals(id, executor = pool) {
  const [[moduleCount]] = await executor.query(
    'SELECT COUNT(*) AS count FROM training_modules WHERE training_id = ?',
    [id]
  )
  const [[lessonCount]] = await executor.query(
    `SELECT COUNT(*) AS count FROM training_lessons tl
     INNER JOIN training_modules tm ON tm.id = tl.module_id
     WHERE tm.training_id = ?`,
    [id]
  )
  await executor.query('UPDATE trainings SET total_modules = ?, total_lessons = ? WHERE id = ?', [
    moduleCount.count,
    lessonCount.count,
    id,
  ])
}

function buildAccessCondition(maxRank, params) {
  const rankMap = { ALL: 0, VERIFIED: 1, QUALIFIED: 2, CERTIFIED: 3, ACTIVE: 4 }
  const allowedLevels = Object.entries(rankMap)
    .filter(([, rank]) => rank <= maxRank)
    .map(([level]) => level)
  params.push(...allowedLevels)
  return `access_level IN (${allowedLevels.map(() => '?').join(',')})`
}

export async function listTrainingsAdmin({ status, categoryId, search, page = 1, limit = 20 }, executor = pool) {
  const conditions = []
  const params = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }
  if (categoryId) {
    conditions.push('category_id = ?')
    params.push(categoryId)
  }
  if (search) {
    conditions.push('title LIKE ?')
    params.push(`%${search}%`)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM trainings ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM trainings ${whereClause}`, params)

  return { rows, total: countRows[0].total }
}

export async function listVisibleTrainings(
  { accessRank, categoryId, search, page = 1, limit = 20 },
  executor = pool
) {
  const conditions = ["status = 'PUBLISHED'"]
  const params = []

  conditions.push(buildAccessCondition(accessRank, params))

  if (categoryId) {
    conditions.push('category_id = ?')
    params.push(categoryId)
  }
  if (search) {
    conditions.push('title LIKE ?')
    params.push(`%${search}%`)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM trainings ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM trainings ${whereClause}`, params)

  return { rows, total: countRows[0].total }
}

export const ACCESS_LEVEL_RANK = { ALL: 0, VERIFIED: 1, QUALIFIED: 2, CERTIFIED: 3, ACTIVE: 4 }
