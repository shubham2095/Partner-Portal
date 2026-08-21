import path from 'node:path'
import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
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
  markCommissionPaid,
  listCommissionsAdmin,
  COMMISSION_STATUSES,
} from '../models/commissionModel.js'
import { createPayment as createPaymentModel, findPaymentByCommissionId, listPaymentsAdmin } from '../models/paymentModel.js'
import { findPaymentDetailsByFreelancerId } from '../models/freelancerPaymentDetailsModel.js'
import { calculateCommissionAmount } from './commissionCalculationService.js'
import { logAudit } from './auditService.js'
import { notify } from './notificationService.js'

const LIFECYCLE_ORDER = ['POTENTIAL', 'EARNED', 'APPROVED', 'PAYABLE', 'PAID']

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
    if (status === 'PAYABLE') {
      throw new ApiError(409, 'Use the payment endpoint to move a commission to PAID; PAYABLE is reached automatically before payment')
    }

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
    if (commission.status !== 'APPROVED') {
      throw new ApiError(409, 'Only approved commissions can be moved to payable/paid')
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
  return findPaymentDetailsByFreelancerId(freelancerId)
}
