import { pool } from '../config/database.js'

export async function createPayment(
  { commissionId, freelancerId, amount, paymentDate, transactionReference, paymentProofPath, processedBy },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO payments (commission_id, freelancer_id, amount, payment_date, transaction_reference, payment_proof_path, processed_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [commissionId, freelancerId, amount, paymentDate, transactionReference ?? null, paymentProofPath ?? null, processedBy]
  )
  return result.insertId
}

export async function findPaymentById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM payments WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function findPaymentByCommissionId(commissionId, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM payments WHERE commission_id = ? LIMIT 1', [commissionId])
  return rows[0] ?? null
}

export async function listPaymentsAdmin({ freelancerId, page = 1, limit = 20 }, executor = pool) {
  const conditions = []
  const params = []

  if (freelancerId) {
    conditions.push('p.freelancer_id = ?')
    params.push(freelancerId)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT p.*, c.lead_id, l.lead_number, fp.full_name AS freelancer_name
     FROM payments p
     INNER JOIN commissions c ON c.id = p.commission_id
     INNER JOIN leads l ON l.id = c.lead_id
     INNER JOIN freelancer_profiles fp ON fp.id = p.freelancer_id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM payments p ${whereClause}`, params)

  return { rows, total: countRows[0].total }
}

export async function listPaymentsForFreelancer(freelancerId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT p.*, c.lead_id, l.lead_number
     FROM payments p
     INNER JOIN commissions c ON c.id = p.commission_id
     INNER JOIN leads l ON l.id = c.lead_id
     WHERE p.freelancer_id = ?
     ORDER BY p.created_at DESC`,
    [freelancerId]
  )
  return rows
}
