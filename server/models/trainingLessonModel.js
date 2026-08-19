import { pool } from '../config/database.js'

export async function createLesson(
  { moduleId, title, description, lessonType, displayOrder, durationMinutes },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO training_lessons (module_id, title, description, lesson_type, display_order, duration_minutes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [moduleId, title, description ?? null, lessonType, displayOrder ?? 0, durationMinutes ?? null]
  )
  return result.insertId
}

export async function findLessonById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM training_lessons WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

const LESSON_FIELDS = ['title', 'description', 'display_order', 'duration_minutes']

export async function updateLesson(id, fields, executor = pool) {
  const entries = Object.entries(fields).filter(([key, value]) => LESSON_FIELDS.includes(key) && value !== undefined)
  if (entries.length === 0) return
  const setClause = entries.map(([key]) => `${key} = ?`).join(', ')
  const values = entries.map(([, value]) => value)
  await executor.query(`UPDATE training_lessons SET ${setClause} WHERE id = ?`, [...values, id])
}

export async function deleteLesson(id, executor = pool) {
  await executor.query('DELETE FROM training_lessons WHERE id = ?', [id])
}

export async function listLessonsByModule(moduleId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM training_lessons WHERE module_id = ? ORDER BY display_order ASC, id ASC',
    [moduleId]
  )
  return rows
}

export async function findLessonWithTraining(id, executor = pool) {
  const [rows] = await executor.query(
    `SELECT tl.*, tm.training_id AS training_id
     FROM training_lessons tl
     INNER JOIN training_modules tm ON tm.id = tl.module_id
     WHERE tl.id = ? LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}
