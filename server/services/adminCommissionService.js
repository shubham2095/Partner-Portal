import path from 'node:path'
import fs from 'node:fs'
import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'
import { findLeadByIdForUpdate } from '../models/leadModel.js'
import { findProfileById } from '../models/freelancerProfileModel.js'
import {
  createRule as createRuleModel,
  findRuleById,
  findActiveRuleByService,
  deactivateActiveRulesForService,
  updateRuleStatus,
  listRules as listRulesModel,
} from '../models/commissionRuleModel.js'
import {
  createCommission as createCommissionModel,
  findCommissionByIdForUpdate,
  findCommissionByLeadId,
  findCommissionDetailById,
  updateCommissionStatus,
  rejectCommission as rejectCommissionModel,
  confirmClientPayment as confirmClientPaymentModel,
  setContractDocumentPath,
  markCommissionPaid,
  listCommissionsAdmin,
  COMMISSION_STATUSES,
} from '../models/commissionModel.js'
import { createPayment as createPaymentModel, findPaymentByCommissionId, listPaymentsAdmin } from '../models/paymentModel.js'
import { findPaymentDetailsByFreelancerId } from '../models/freelancerPaymentDetailsModel.js'
import { calculateCommissionAmount } from './commissionCalculationService.js'
import { renderContractPdf } from './contractPdfService.js'
import { logAudit } from './auditService.js'
import { notify } from './notificationService.js'

const LIFECYCLE_ORDER = ['POTENTIAL', 'EARNED', 'APPROVED', 'PAYABLE', 'PAID']

// Same masking used on the freelancer's own view — admin functionality is
// "authorized" per the audit requirements, but nothing in Part 3 needs the
// raw account number (no payout automation yet), so it stays masked here too.
function maskAccountNumber(accountNumber) {
  if (!accountNumber) return null
  const digits = String(accountNumber)
  if (digits.length <= 4) return digits
  return `${'X'.repeat(digits.length - 4)}${digits.slice(-4)}`
}

function nextStatus(current) {
  const index = LIFECYCLE_ORDER.indexOf(current)
  return index >= 0 && index < LIFECYCLE_ORDER.length - 1 ? LIFECYCLE_ORDER[index + 1] : null
}

// ---- Commission Rules ----

export async function listRules(query) {
  return listRulesModel(query)
}

export async function createRule(payload, adminId, req) {
  await deactivateActiveRulesForService(payload.serviceName)
  const id = await createRuleModel({ ...payload, createdBy: adminId })
  await logAudit({
    actorId: adminId,
    action: 'COMMISSION_RULE_CREATED',
    entity: 'commission_rule',
    entityId: id,
    newValue: payload,
    req,
  })
  return findRuleById(id)
}

export async function changeRuleStatus(id, status, adminId, req) {
  const rule = await findRuleById(id)
  if (!rule) {
    throw new ApiError(404, 'Commission rule not found')
  }
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new ApiError(422, 'Invalid rule status')
  }
  await updateRuleStatus(id, status)
  await logAudit({
    actorId: adminId,
    action: 'COMMISSION_RULE_STATUS_CHANGED',
    entity: 'commission_rule',
    entityId: id,
    oldValue: { status: rule.status },
    newValue: { status },
    req,
  })
  return findRuleById(id)
}

// ---- Commissions ----

export async function listCommissions(query) {
  const { rows, total } = await listCommissionsAdmin(query)
  return { rows, total, page: query.page, limit: query.limit }
}

export async function getCommissionDetail(id) {
  const commission = await findCommissionDetailById(id)
  if (!commission) {
    throw new ApiError(404, 'Commission not found')
  }
  const payment = await findPaymentByCommissionId(id)
  return { commission, payment }
}

export async function createCommissionForLead(leadId, adminId, req) {
  const connection = await pool.getConnection()
  let commissionId
  let lead
  let rule
  let commissionAmount

  try {
    await connection.beginTransaction()

    lead = await findLeadByIdForUpdate(leadId, connection)
    if (!lead) {
      throw new ApiError(404, 'Lead not found')
    }
    if (lead.status !== 'CONVERTED') {
      throw new ApiError(409, 'Only converted leads are eligible for commission')
    }
    if (!lead.conversion_value || Number(lead.conversion_value) <= 0) {
      throw new ApiError(409, 'Lead has no valid conversion value')
    }
    if (!lead.assigned_freelancer_id) {
      throw new ApiError(409, 'Lead has no assigned freelancer')
    }

    const existing = await findCommissionByLeadId(leadId, connection)
    if (existing) {
      throw new ApiError(409, 'A commission already exists for this lead')
    }

    rule = await findActiveRuleByService(lead.service_interested ?? '', connection)
    if (!rule) {
      throw new ApiError(
        422,
        `No active commission rule found for service "${lead.service_interested ?? 'unspecified'}". Configure a commission rule first.`
      )
    }

    commissionAmount = calculateCommissionAmount(lead.conversion_value, rule.rate_type, rule.rate_value)

    commissionId = await createCommissionModel(
      {
        leadId,
        freelancerId: lead.assigned_freelancer_id,
        commissionRuleId: rule.id,
        ruleServiceName: rule.service_name,
        ruleRateType: rule.rate_type,
        ruleRateValue: rule.rate_value,
        saleValue: lead.conversion_value,
        commissionAmount,
        createdBy: adminId,
      },
      connection
    )

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await logAudit({
    actorId: adminId,
    action: 'COMMISSION_CREATED',
    entity: 'commission',
    entityId: commissionId,
    newValue: { leadId, freelancerId: lead.assigned_freelancer_id, commissionAmount, ruleId: rule.id },
    req,
  })

  return findCommissionDetailById(commissionId)
}

// Client payment is a distinct, explicit admin action — never inferred from
// the lead's CONVERTED status (Part 6 Phase 4). changeCommissionStatus below
// refuses to approve a commission until this has been recorded.
export async function confirmClientPayment(id, adminId, req) {
  const commission = await findCommissionByIdForUpdate(id)
  if (!commission) {
    throw new ApiError(404, 'Commission not found')
  }
  if (commission.status === 'PAID' || commission.status === 'REJECTED') {
    throw new ApiError(409, `Client payment cannot be confirmed on a ${commission.status} commission`)
  }
  await confirmClientPaymentModel(id, adminId)

  await logAudit({
    actorId: adminId,
    action: 'CLIENT_PAYMENT_CONFIRMED',
    entity: 'commission',
    entityId: id,
    req,
  })

  return findCommissionDetailById(id)
}

async function generateAndStoreContract(commission, adminId) {
  const detail = await findCommissionDetailById(commission.id)
  const freelancerProfile = await findProfileById(commission.freelancer_id)
  const pdfBuffer = await renderContractPdf({
    commissionId: detail.id,
    freelancerName: detail.freelancer_name,
    partnerId: detail.partner_id,
    clientName: detail.client_name,
    companyName: detail.company,
    serviceInterested: detail.service_interested,
    saleValue: detail.sale_value,
    ruleRateType: detail.rule_rate_type,
    ruleRateValue: detail.rule_rate_value,
    commissionAmount: detail.commission_amount,
    dealClosingDate: detail.deal_closing_date,
    clientPaymentReceivedAt: detail.client_payment_received_at,
    declarationNote: detail.declaration_note,
    approvedAt: detail.approved_at,
  })

  const contractsDir = path.join(process.cwd(), env.upload.dir, 'contracts')
  fs.mkdirSync(contractsDir, { recursive: true })
  const filePath = path.join(contractsDir, `commission-${commission.id}.pdf`)
  fs.writeFileSync(filePath, pdfBuffer)
  const relativePath = path.relative(process.cwd(), filePath).split(path.sep).join('/')
  await setContractDocumentPath(commission.id, relativePath)
  return relativePath
}

export async function changeCommissionStatus(id, status, adminId, req) {
  const connection = await pool.getConnection()
  let commission

  try {
    await connection.beginTransaction()
    commission = await findCommissionByIdForUpdate(id, connection)
    if (!commission) {
      throw new ApiError(404, 'Commission not found')
    }
    if (commission.status === 'PAID') {
      throw new ApiError(409, 'A paid commission cannot be modified')
    }
    if (!COMMISSION_STATUSES.includes(status)) {
      throw new ApiError(422, 'Invalid commission status')
    }
    const expectedNext = nextStatus(commission.status)
    if (status !== expectedNext) {
      throw new ApiError(409, `Commission must move from ${commission.status} to ${expectedNext ?? 'a terminal state'} — cannot jump to ${status}`)
    }
    // Client Payment Received is a hard gate on approval (Part 6 Phase 4) —
    // a commission can sit in EARNED indefinitely until an admin explicitly
    // confirms the client actually paid the company.
    if (status === 'APPROVED' && !commission.client_payment_received_at) {
      throw new ApiError(409, 'Confirm client payment before approving this commission')
    }
    // APPROVED -> PAYABLE is the Part 4 gate: only once a commission is
    // PAYABLE can the freelancer request a withdrawal against it (see
    // withdrawalModel.getAvailableBalance). Reaching PAYABLE does not pay
    // anything by itself — that still only happens via createPayment below
    // or via a withdrawal being marked paid (adminWithdrawalService).

    const approvedFields =
      status === 'APPROVED' ? { approvedBy: adminId, approvedAt: new Date() } : { approvedBy: null, approvedAt: null }

    await updateCommissionStatus(id, { status, ...approvedFields }, connection)
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await logAudit({
    actorId: adminId,
    action: 'COMMISSION_STATUS_CHANGED',
    entity: 'commission',
    entityId: id,
    oldValue: { status: commission.status },
    newValue: { status },
    req,
  })

  // A downloadable contract record is generated once, the moment the
  // commission first reaches APPROVED — the PDF snapshot reflects exactly
  // the state that was approved, not whatever the row looks like later.
  if (status === 'APPROVED') {
    generateAndStoreContract({ id, freelancer_id: commission.freelancer_id }, adminId).catch((error) =>
      console.error('[adminCommissionService] Failed to generate contract document:', error.message)
    )
  }

  const freelancerProfile = await findProfileById(commission.freelancer_id)
  notify({
    recipientUserId: freelancerProfile.user_id,
    type: 'COMMISSION_STATUS_CHANGED',
    title: 'Commission status updated',
    message: `Your commission of ₹${commission.commission_amount} moved to ${status}.`,
    relatedEntityType: 'commission',
    relatedEntityId: id,
    emailSubject: 'Commission status updated',
    emailHtml: `<p>Your commission of ₹${commission.commission_amount} moved to <strong>${status}</strong>.</p>`,
  }).catch((error) => console.error('[adminCommissionService] Failed to notify freelancer of status change:', error.message))

  return findCommissionDetailById(id)
}

// ---- Payments (payout) ----

function toRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/')
}

export async function createPayment(commissionId, payload, file, adminId, req) {
  const connection = await pool.getConnection()
  let commission

  try {
    await connection.beginTransaction()
    commission = await findCommissionByIdForUpdate(commissionId, connection)
    if (!commission) {
      throw new ApiError(404, 'Commission not found')
    }
    if (!['APPROVED', 'PAYABLE'].includes(commission.status)) {
      throw new ApiError(409, 'Only approved or payable commissions can be moved to paid')
    }
    if (commission.withdrawal_request_id) {
      throw new ApiError(409, 'This commission is reserved by a withdrawal request — mark that withdrawal paid instead')
    }

    const existingPayment = await findPaymentByCommissionId(commissionId, connection)
    if (existingPayment) {
      throw new ApiError(409, 'This commission has already been paid')
    }

    await updateCommissionStatus(commissionId, { status: 'PAYABLE' }, connection)

    await createPaymentModel(
      {
        commissionId,
        freelancerId: commission.freelancer_id,
        amount: commission.commission_amount,
        paymentDate: payload.paymentDate,
        transactionReference: payload.transactionReference,
        paymentProofPath: file ? toRelativePath(file.path) : null,
        processedBy: adminId,
      },
      connection
    )

    await markCommissionPaid(commissionId, connection)
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await logAudit({
    actorId: adminId,
    action: 'PAYMENT_CREATED',
    entity: 'commission',
    entityId: commissionId,
    newValue: { amount: commission.commission_amount, transactionReference: payload.transactionReference ?? null },
    req,
  })

  const freelancerProfile = await findProfileById(commission.freelancer_id)
  notify({
    recipientUserId: freelancerProfile.user_id,
    type: 'PAYMENT_RECORDED',
    title: 'Payment recorded',
    message: `A payment of ₹${commission.commission_amount} has been recorded for your commission.`,
    relatedEntityType: 'commission',
    relatedEntityId: commissionId,
    emailSubject: 'Payment recorded',
    emailHtml: `<p>A payment of ₹${commission.commission_amount} has been recorded for your commission.</p>`,
  }).catch((error) => console.error('[adminCommissionService] Failed to notify freelancer of payment:', error.message))

  return getCommissionDetail(commissionId)
}

export async function listPayments(query) {
  const { rows, total } = await listPaymentsAdmin(query)
  return { rows, total, page: query.page, limit: query.limit }
}

export async function getFreelancerPaymentDetails(freelancerId) {
  const profile = await findProfileById(freelancerId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer not found')
  }
  const details = await findPaymentDetailsByFreelancerId(freelancerId)
  if (!details) return null
  const { bank_account_number, ...rest } = details
  return { ...rest, bank_account_number_masked: maskAccountNumber(bank_account_number) }
}

// ---- Closed deal review ----

export async function rejectCommission(id, reason, adminId, req) {
  const connection = await pool.getConnection()
  let commission

  try {
    await connection.beginTransaction()
    commission = await findCommissionByIdForUpdate(id, connection)
    if (!commission) {
      throw new ApiError(404, 'Commission not found')
    }
    if (!['POTENTIAL', 'EARNED'].includes(commission.status)) {
      throw new ApiError(409, 'Only an unapproved closed-deal submission can be rejected')
    }

    await rejectCommissionModel(id, reason, connection)
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await logAudit({
    actorId: adminId,
    action: 'DEAL_REJECTED',
    entity: 'commission',
    entityId: id,
    oldValue: { status: commission.status },
    newValue: { status: 'REJECTED', reason },
    req,
  })

  const freelancerProfile = await findProfileById(commission.freelancer_id)
  notify({
    recipientUserId: freelancerProfile.user_id,
    type: 'COMMISSION_STATUS_CHANGED',
    title: 'Closed deal rejected',
    message: `Your closed-deal submission of ₹${commission.commission_amount} was rejected: ${reason}`,
    relatedEntityType: 'commission',
    relatedEntityId: id,
    emailSubject: 'Closed deal rejected',
    emailHtml: `<p>Your closed-deal submission of ₹${commission.commission_amount} was rejected.</p><p><strong>Reason:</strong> ${reason}</p>`,
  }).catch((error) => console.error('[adminCommissionService] Failed to notify freelancer of rejection:', error.message))

  return findCommissionDetailById(id)
}
