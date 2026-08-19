import { pool } from '../config/database.js'

const QUESTION_FIELDS = [
  'question_text',
  'options',
  'correct_answer',
  'explanation',
  'marks',
  'negative_marks',
  'category',
  'difficulty',
]

function serializeOptions(row) {
  if (!row) return row
  return { ...row, options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options }
}

export async function createQuestion(
  { questionText, options, correctAnswer, explanation, marks, negativeMarks, category, difficulty, createdBy },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO questions
       (question_text, options, correct_answer, explanation, marks, negative_marks, category, difficulty, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      questionText,
      JSON.stringify(options),
      correctAnswer,
      explanation ?? null,
      marks ?? 1,
      negativeMarks ?? 0,
      category ?? null,
      difficulty ?? 'MEDIUM',
      createdBy,
    ]
  )
  return result.insertId
}

export async function findQuestionById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM questions WHERE id = ? LIMIT 1', [id])
  return serializeOptions(rows[0]) ?? null
}

export async function findQuestionsByIds(ids, executor = pool) {
  if (ids.length === 0) return []
  const [rows] = await executor.query(`SELECT * FROM questions WHERE id IN (?)`, [ids])
  return rows.map(serializeOptions)
}

export async function updateQuestion(id, fields, executor = pool) {
  const entries = Object.entries(fields).filter(([key, value]) => QUESTION_FIELDS.includes(key) && value !== undefined)
  if (entries.length === 0) return

  const setClause = entries.map(([key]) => `${key} = ?`).join(', ')
  const values = entries.map(([key, value]) => (key === 'options' ? JSON.stringify(value) : value))
  await executor.query(`UPDATE questions SET ${setClause} WHERE id = ?`, [...values, id])
}

export async function updateQuestionStatus(id, status, executor = pool) {
  await executor.query('UPDATE questions SET status = ? WHERE id = ?', [status, id])
}

export async function listQuestions({ category, difficulty, status, search, page = 1, limit = 20 }, executor = pool) {
  const conditions = []
  const params = []

  if (category) {
    conditions.push('category = ?')
    params.push(category)
  }

  if (difficulty) {
    conditions.push('difficulty = ?')
    params.push(difficulty)
  }

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  if (search) {
    conditions.push('question_text LIKE ?')
    params.push(`%${search}%`)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM questions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM questions ${whereClause}`, params)

  return { rows: rows.map(serializeOptions), total: countRows[0].total }
}
