import { pool } from '../config/database.js'

const TEST_FIELDS = [
  'title',
  'description',
  'instructions',
  'webinar_id',
  'duration_minutes',
  'passing_percentage',
  'max_attempts',
  'negative_marking_enabled',
  'randomize_questions',
  'question_count',
]

export async function createTest(
  {
    title,
    description,
    instructions,
    webinarId,
    durationMinutes,
    passingPercentage,
    maxAttempts,
    negativeMarkingEnabled,
    randomizeQuestions,
    questionCount,
    createdBy,
  },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO tests
       (title, description, instructions, webinar_id, duration_minutes, passing_percentage,
        max_attempts, negative_marking_enabled, randomize_questions, question_count, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description ?? null,
      instructions ?? null,
      webinarId ?? null,
      durationMinutes ?? 30,
      passingPercentage ?? 70,
      maxAttempts ?? 1,
      negativeMarkingEnabled ? 1 : 0,
      randomizeQuestions ? 1 : 0,
      questionCount ?? 0,
      createdBy,
    ]
  )
  return result.insertId
}

export async function findTestById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM tests WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function updateTest(id, fields, executor = pool) {
  const entries = Object.entries(fields).filter(([key, value]) => TEST_FIELDS.includes(key) && value !== undefined)
  if (entries.length === 0) return

  const setClause = entries.map(([key]) => `${key} = ?`).join(', ')
  const values = entries.map(([, value]) => value)
  await executor.query(`UPDATE tests SET ${setClause} WHERE id = ?`, [...values, id])
}

export async function updateTestStatus(id, status, executor = pool) {
  await executor.query('UPDATE tests SET status = ? WHERE id = ?', [status, id])
}

export async function updateTestTotals(id, { totalMarks, questionCount }, executor = pool) {
  await executor.query('UPDATE tests SET total_marks = ?, question_count = ? WHERE id = ?', [
    totalMarks,
    questionCount,
    id,
  ])
}

export async function listTests({ status, webinarId, search, page = 1, limit = 20 }, executor = pool) {
  const conditions = []
  const params = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  if (webinarId) {
    conditions.push('webinar_id = ?')
    params.push(webinarId)
  }

  if (search) {
    conditions.push('title LIKE ?')
    params.push(`%${search}%`)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM tests ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM tests ${whereClause}`, params)

  return { rows, total: countRows[0].total }
}
