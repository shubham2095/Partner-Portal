import { pool } from '../config/database.js'

export async function createCategory({ name, description, displayOrder, createdBy }, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO training_categories (name, description, display_order, created_by)
     VALUES (?, ?, ?, ?)`,
    [name, description ?? null, displayOrder ?? 0, createdBy]
  )
  return result.insertId
}

export async function findCategoryById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM training_categories WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

const CATEGORY_FIELDS = ['name', 'description', 'display_order', 'status']

export async function updateCategory(id, fields, executor = pool) {
  const entries = Object.entries(fields).filter(([key, value]) => CATEGORY_FIELDS.includes(key) && value !== undefined)
  if (entries.length === 0) return
  const setClause = entries.map(([key]) => `${key} = ?`).join(', ')
  const values = entries.map(([, value]) => value)
  await executor.query(`UPDATE training_categories SET ${setClause} WHERE id = ?`, [...values, id])
}

export async function listCategories({ status, search } = {}, executor = pool) {
  const conditions = []
  const params = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  if (search) {
    conditions.push('name LIKE ?')
    params.push(`%${search}%`)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const [rows] = await executor.query(
    `SELECT * FROM training_categories ${whereClause} ORDER BY display_order ASC, name ASC`,
    params
  )
  return rows
}
