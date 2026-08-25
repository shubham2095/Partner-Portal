import { pool } from '../config/database.js'

export const WITHDRAWAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'PAID']

export async function createWithdrawal({ freelancerId, amount }, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO withdrawal_requests (freelancer_id, amount) VALUES (?, ?)`,
    [freelancerId, amount]
  )
  return result.insertId
}

export async function findWithdrawalById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM withdrawal_requests WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function findWithdrawalByIdForUpdate(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM withdrawal_requests WHERE id = ? LIMIT 1 FOR UPDATE', [id])
  return rows[0] ?? null
}

export async function findWithdrawalDetailById(id, executor = pool) {
  const [rows] = await executor.query(
    `SELECT w.*, fp.full_name AS freelancer_name, fp.partner_id, reviewer.email AS reviewed_by_email
     FROM withdrawal_requests w
     INNER JOIN freelancer_profiles fp ON fp.id = w.freelancer_id
     LEFT JOIN users reviewer ON reviewer.id = w.reviewed_by
     WHERE w.id = ? LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}

export async function updateWithdrawalStatus(
  id,
  { status, reviewedBy, reviewedAt, rejectionReason, transactionReference, paidAt, adminNote },
  executor = pool
) {
  await executor.query(
    `UPDATE withdrawal_requests
     SET status = ?,
         reviewed_by = COALESCE(?, reviewed_by), reviewed_at = COALESCE(?, reviewed_at),
         rejection_reason = COALESCE(?, rejection_reason),
         transaction_reference = COALESCE(?, transaction_reference),
         paid_at = COALESCE(?, paid_at),
         admin_note = COALESCE(?, admin_note)
     WHERE id = ?`,
    [
      status,
      reviewedBy ?? null,
      reviewedAt ?? null,
      rejectionReason ?? null,
      transactionReference ?? null,
      paidAt ?? null,
      adminNote ?? null,
      id,
    ]
  )
}

// Reserved-but-unpaid commissions belonging to a rejected withdrawal return
// to the available pool by clearing the link — see the migration comment on
// commissions.withdrawal_request_id for why this alone is sufficient.
export async function releaseCommissionsForWithdrawal(withdrawalId, executor = pool) {
  await executor.query('UPDATE commissions SET withdrawal_request_id = NULL WHERE withdrawal_request_id = ?', [
    withdrawalId,
  ])
}

export async function linkCommissionsToWithdrawal(commissionIds, withdrawalId, executor = pool) {
  if (commissionIds.length === 0) return
  await executor.query(
    `UPDATE commissions SET withdrawal_request_id = ? WHERE id IN (${commissionIds.map(() => '?').join(',')})`,
    [withdrawalId, ...commissionIds]
  )
}

export async function findCommissionsByWithdrawal(withdrawalId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT c.*, l.lead_number, l.client_name
     FROM commissions c
     INNER JOIN leads l ON l.id = c.lead_id
     WHERE c.withdrawal_request_id = ?`,
    [withdrawalId]
  )
  return rows
}

// Locks the freelancer's unreserved PAYABLE commissions (oldest first) so
// concurrent withdrawal requests can never both reserve the same commission
// — the FOR UPDATE row lock is held for the rest of the caller's transaction.
export async function lockAvailableCommissions(freelancerId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT * FROM commissions
     WHERE freelancer_id = ? AND status = 'PAYABLE' AND withdrawal_request_id IS NULL
     ORDER BY created_at ASC
     FOR UPDATE`,
    [freelancerId]
  )
  return rows
}

export async function getAvailableBalance(freelancerId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT COALESCE(SUM(commission_amount), 0) AS total FROM commissions
     WHERE freelancer_id = ? AND status = 'PAYABLE' AND withdrawal_request_id IS NULL`,
    [freelancerId]
  )
  return Number(rows[0].total)
}

export async function markLinkedCommissionsPaid(withdrawalId, executor = pool) {
  await executor.query("UPDATE commissions SET status = 'PAID' WHERE withdrawal_request_id = ?", [withdrawalId])
}

export async function listWithdrawalsAdmin(
  { status, freelancerId, search, page = 1, limit = 20 },
  executor = pool
) {
  const conditions = []
  const params = []

  if (status) {
    conditions.push('w.status = ?')
    params.push(status)
  }
  if (freelancerId) {
    conditions.push('w.freelancer_id = ?')
    params.push(freelancerId)
  }
  if (search) {
    conditions.push('(fp.full_name LIKE ? OR fp.partner_id LIKE ?)')
    const like = `%${search}%`
    params.push(like, like)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT w.*, fp.full_name AS freelancer_name, fp.partner_id
     FROM withdrawal_requests w
     INNER JOIN freelancer_profiles fp ON fp.id = w.freelancer_id
     ${whereClause}
     ORDER BY w.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(
    `SELECT COUNT(*) AS total FROM withdrawal_requests w INNER JOIN freelancer_profiles fp ON fp.id = w.freelancer_id ${whereClause}`,
    params
  )

  return { rows, total: countRows[0].total }
}

export async function getWithdrawalSummary(freelancerId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT status, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
     FROM withdrawal_requests WHERE freelancer_id = ? GROUP BY status`,
    [freelancerId]
  )
  return rows
}

export async function listWithdrawalsForFreelancer({ freelancerId, status, page = 1, limit = 20 }, executor = pool) {
  const conditions = ['freelancer_id = ?']
  const params = [freelancerId]

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM withdrawal_requests ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM withdrawal_requests ${whereClause}`, params)

  return { rows, total: countRows[0].total }
}
