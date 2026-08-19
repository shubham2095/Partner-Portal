import { pool } from '../config/database.js'

export async function createModule({ trainingId, title, description, displayOrder }, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO training_modules (training_id, title, description, display_order)
     VALUES (?, ?, ?, ?)`,
    [trainingId, title, description ?? null, displayOrder ?? 0]
  )
  return result.insertId
}

export async function findModuleById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM training_modules WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

const MODULE_FIELDS = ['title', 'description', 'display_order']

export async function updateModule(id, fields, executor = pool) {
  const entries = Object.entries(fields).filter(([key, value]) => MODULE_FIELDS.includes(key) && value !== undefined)
  if (entries.length === 0) return
  const setClause = entries.map(([key]) => `${key} = ?`).join(', ')
  const values = entries.map(([, value]) => value)
  await executor.query(`UPDATE training_modules SET ${setClause} WHERE id = ?`, [...values, id])
}

export async function deleteModule(id, executor = pool) {
  await executor.query('DELETE FROM training_modules WHERE id = ?', [id])
}

export async function listModulesByTraining(trainingId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM training_modules WHERE training_id = ? ORDER BY display_order ASC, id ASC',
    [trainingId]
  )
  return rows
}
