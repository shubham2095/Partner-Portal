import { pool } from '../config/database.js'

export async function createRule({ serviceName, rateType, rateValue, createdBy }, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO commission_rules (service_name, rate_type, rate_value, created_by)
     VALUES (?, ?, ?, ?)`,
    [serviceName, rateType, rateValue, createdBy]
  )
  return result.insertId
}

export async function findRuleById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM commission_rules WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function findActiveRuleByService(serviceName, executor = pool) {
  const [rows] = await executor.query(
    `SELECT * FROM commission_rules
     WHERE status = 'ACTIVE' AND LOWER(TRIM(service_name)) = LOWER(TRIM(?))
     ORDER BY created_at DESC LIMIT 1`,
    [serviceName]
  )
  return rows[0] ?? null
}

export async function deactivateActiveRulesForService(serviceName, executor = pool) {
  await executor.query(
    `UPDATE commission_rules SET status = 'INACTIVE'
     WHERE status = 'ACTIVE' AND LOWER(TRIM(service_name)) = LOWER(TRIM(?))`,
    [serviceName]
  )
}

export async function updateRuleStatus(id, status, executor = pool) {
  await executor.query('UPDATE commission_rules SET status = ? WHERE id = ?', [status, id])
}

export async function listRules({ status, search } = {}, executor = pool) {
  const conditions = []
  const params = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }
  if (search) {
    conditions.push('service_name LIKE ?')
    params.push(`%${search}%`)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const [rows] = await executor.query(
    `SELECT cr.*, u.email AS created_by_email
     FROM commission_rules cr
     LEFT JOIN users u ON u.id = cr.created_by
     ${whereClause}
     ORDER BY cr.service_name ASC, cr.created_at DESC`,
    params
  )
  return rows
}
