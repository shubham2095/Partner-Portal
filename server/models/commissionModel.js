import { pool } from '../config/database.js'

export const COMMISSION_STATUSES = ['POTENTIAL', 'EARNED', 'APPROVED', 'PAYABLE', 'PAID', 'REJECTED']

export async function createCommission(
  {
    leadId,
    freelancerId,
    commissionRuleId,
    ruleServiceName,
    ruleRateType,
    ruleRateValue,
    saleValue,
    commissionAmount,
    declarationNote,
    termsAccepted,
    dealClosingDate,
    supportingDocumentPath,
    createdBy,
  },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO commissions
       (lead_id, freelancer_id, commission_rule_id, rule_service_name, rule_rate_type, rule_rate_value,
        sale_value, declaration_note, terms_accepted, deal_closing_date, supporting_document_path, commission_amount, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      leadId,
      freelancerId,
      commissionRuleId ?? null,
      ruleServiceName ?? null,
      ruleRateType ?? null,
      ruleRateValue ?? null,
      saleValue,
      declarationNote ?? null,
      termsAccepted ? 1 : 0,
      dealClosingDate ?? null,
      supportingDocumentPath ?? null,
      commissionAmount,
      createdBy,
    ]
  )
  return result.insertId
}

// A rejected closed-deal submission is resubmitted onto the SAME row
// (never a new INSERT) because commissions.lead_id is UNIQUE — one lead can
// only ever have one commission record, so resubmission must update it back
// to POTENTIAL rather than create a second one.
export async function resubmitCommission(
  id,
  {
    commissionRuleId,
    ruleServiceName,
    ruleRateType,
    ruleRateValue,
    saleValue,
    commissionAmount,
    declarationNote,
    termsAccepted,
    dealClosingDate,
    supportingDocumentPath,
  },
  executor = pool
) {
  await executor.query(
    `UPDATE commissions
     SET status = 'POTENTIAL', rejection_reason = NULL,
         commission_rule_id = ?, rule_service_name = ?, rule_rate_type = ?, rule_rate_value = ?,
         sale_value = ?, commission_amount = ?, declaration_note = ?, terms_accepted = ?, deal_closing_date = ?,
         supporting_document_path = ?,
         client_payment_received_at = NULL, client_payment_confirmed_by = NULL, contract_document_path = NULL
     WHERE id = ?`,
    [
      commissionRuleId ?? null,
      ruleServiceName ?? null,
      ruleRateType ?? null,
      ruleRateValue ?? null,
      saleValue,
      commissionAmount,
      declarationNote ?? null,
      termsAccepted ? 1 : 0,
      dealClosingDate ?? null,
      supportingDocumentPath ?? null,
      id,
    ]
  )
}

export async function rejectCommission(id, reason, executor = pool) {
  await executor.query("UPDATE commissions SET status = 'REJECTED', rejection_reason = ? WHERE id = ?", [reason, id])
}

export async function confirmClientPayment(id, adminId, executor = pool) {
  await executor.query(
    'UPDATE commissions SET client_payment_received_at = NOW(), client_payment_confirmed_by = ? WHERE id = ?',
    [adminId, id]
  )
}

export async function setContractDocumentPath(id, relativePath, executor = pool) {
  await executor.query('UPDATE commissions SET contract_document_path = ? WHERE id = ?', [relativePath, id])
}

export async function findCommissionById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM commissions WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function findCommissionByIdForUpdate(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM commissions WHERE id = ? LIMIT 1 FOR UPDATE', [id])
  return rows[0] ?? null
}

export async function findCommissionByLeadId(leadId, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM commissions WHERE lead_id = ? LIMIT 1', [leadId])
  return rows[0] ?? null
}

export async function findCommissionDetailById(id, executor = pool) {
  const [rows] = await executor.query(
    `SELECT c.*, l.lead_number, l.client_name, l.company, l.service_interested,
            fp.full_name AS freelancer_name, fp.partner_id,
            approver.email AS approved_by_email, creator.email AS created_by_email
     FROM commissions c
     INNER JOIN leads l ON l.id = c.lead_id
     INNER JOIN freelancer_profiles fp ON fp.id = c.freelancer_id
     LEFT JOIN users approver ON approver.id = c.approved_by
     LEFT JOIN users creator ON creator.id = c.created_by
     WHERE c.id = ? LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}

export async function updateCommissionStatus(id, { status, approvedBy, approvedAt }, executor = pool) {
  await executor.query(
    `UPDATE commissions
     SET status = ?, approved_by = COALESCE(?, approved_by), approved_at = COALESCE(?, approved_at)
     WHERE id = ?`,
    [status, approvedBy ?? null, approvedAt ?? null, id]
  )
}

export async function markCommissionPaid(id, executor = pool) {
  await executor.query("UPDATE commissions SET status = 'PAID' WHERE id = ?", [id])
}

export async function listCommissionsAdmin(
  { status, freelancerId, search, sortBy = 'created_at', sortDir = 'DESC', page = 1, limit = 20 },
  executor = pool
) {
  const conditions = []
  const params = []

  if (status) {
    conditions.push('c.status = ?')
    params.push(status)
  }
  if (freelancerId) {
    conditions.push('c.freelancer_id = ?')
    params.push(freelancerId)
  }
  if (search) {
    conditions.push('(l.client_name LIKE ? OR l.lead_number LIKE ? OR fp.full_name LIKE ?)')
    const like = `%${search}%`
    params.push(like, like, like)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const sortColumns = new Set(['created_at', 'commission_amount', 'sale_value', 'status'])
  const orderColumn = sortColumns.has(sortBy) ? sortBy : 'created_at'
  const orderDir = sortDir === 'ASC' ? 'ASC' : 'DESC'
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT c.*, l.lead_number, l.client_name, fp.full_name AS freelancer_name, fp.partner_id
     FROM commissions c
     INNER JOIN leads l ON l.id = c.lead_id
     INNER JOIN freelancer_profiles fp ON fp.id = c.freelancer_id
     ${whereClause}
     ORDER BY c.${orderColumn} ${orderDir}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(
    `SELECT COUNT(*) AS total FROM commissions c
     INNER JOIN leads l ON l.id = c.lead_id
     INNER JOIN freelancer_profiles fp ON fp.id = c.freelancer_id
     ${whereClause}`,
    params
  )

  return { rows, total: countRows[0].total }
}

export async function listCommissionsForFreelancer({ freelancerId, status, page = 1, limit = 20 }, executor = pool) {
  const conditions = ['c.freelancer_id = ?']
  const params = [freelancerId]

  if (status) {
    conditions.push('c.status = ?')
    params.push(status)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT c.*, l.lead_number, l.client_name
     FROM commissions c
     INNER JOIN leads l ON l.id = c.lead_id
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(
    `SELECT COUNT(*) AS total FROM commissions c ${whereClause}`,
    params
  )

  return { rows, total: countRows[0].total }
}

export async function getFreelancerCommissionSummary(freelancerId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT status, COUNT(*) AS count, COALESCE(SUM(commission_amount), 0) AS total
     FROM commissions WHERE freelancer_id = ? GROUP BY status`,
    [freelancerId]
  )
  return rows
}
