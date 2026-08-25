import path from 'node:path'
import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import {
  findCommissionDetailById,
  findCommissionByLeadId,
  createCommission as createCommissionModel,
  resubmitCommission,
  listCommissionsForFreelancer,
  getFreelancerCommissionSummary,
} from '../models/commissionModel.js'
import { findLeadByIdForUpdate } from '../models/leadModel.js'
import { findActiveRuleByService } from '../models/commissionRuleModel.js'
import { calculateCommissionAmount } from './commissionCalculationService.js'
import { findPaymentByCommissionId, listPaymentsForFreelancer } from '../models/paymentModel.js'
import {
  findPaymentDetailsByFreelancerId,
  upsertPaymentDetails,
} from '../models/freelancerPaymentDetailsModel.js'
import { listLevelHistory } from '../models/partnerLevelModel.js'
import { logAudit } from './auditService.js'
import { notifyAdmins } from './notificationService.js'

// Never round-trip a full account number back to the client — masked
// display only, matching how the account number is never logged in full
// either (see logAudit calls below).
function maskAccountNumber(accountNumber) {
  if (!accountNumber) return null
  const digits = String(accountNumber)
  if (digits.length <= 4) return digits
  return `${'X'.repeat(digits.length - 4)}${digits.slice(-4)}`
}

function toSafePaymentDetails(details) {
  if (!details) return null
  const { bank_account_number, ...rest } = details
  return { ...rest, bank_account_number_masked: maskAccountNumber(bank_account_number) }
}

async function requireProfile(userId) {
  const profile = await findProfileByUserId(userId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }
  return profile
}

export async function listMyCommissions(userId, query) {
  const profile = await requireProfile(userId)
  const { rows, total } = await listCommissionsForFreelancer({ ...query, freelancerId: profile.id })
  return { rows, total, page: query.page, limit: query.limit }
}

export async function getMyCommissionDetail(id, userId) {
  const profile = await requireProfile(userId)
  const commission = await findCommissionDetailById(id)
  if (!commission || commission.freelancer_id !== profile.id) {
    throw new ApiError(404, 'Commission not found')
  }
  const payment = await findPaymentByCommissionId(id)
  return { commission, payment }
}

export async function getMyContractPath(id, userId) {
  const { commission } = await getMyCommissionDetail(id, userId)
  return commission.contract_document_path
}

const SUMMARY_BUCKETS = {
  earned: ['EARNED', 'APPROVED', 'PAYABLE', 'PAID'],
  pending: ['POTENTIAL', 'EARNED', 'APPROVED', 'PAYABLE'],
  paid: ['PAID'],
}

export async function getMyEarningsSummary(userId) {
  const profile = await requireProfile(userId)
  const rows = await getFreelancerCommissionSummary(profile.id)
  const byStatus = new Map(rows.map((row) => [row.status, { count: row.count, total: Number(row.total) }]))

  const sumBuckets = (statuses) =>
    statuses.reduce((sum, status) => sum + (byStatus.get(status)?.total ?? 0), 0)

  return {
    partnerLevel: profile.partner_level,
    byStatus: Object.fromEntries(byStatus),
    commissionEarned: Math.round(sumBuckets(SUMMARY_BUCKETS.earned) * 100) / 100,
    commissionPending: Math.round(sumBuckets(SUMMARY_BUCKETS.pending) * 100) / 100,
    commissionPaid: Math.round(sumBuckets(SUMMARY_BUCKETS.paid) * 100) / 100,
  }
}

export async function getMyPaymentDetails(userId) {
  const profile = await requireProfile(userId)
  const details = await findPaymentDetailsByFreelancerId(profile.id)
  return toSafePaymentDetails(details)
}

export async function updateMyPaymentDetails(userId, fields, req) {
  const profile = await requireProfile(userId)
  const existed = Boolean(await findPaymentDetailsByFreelancerId(profile.id))
  const updated = await upsertPaymentDetails(profile.id, fields)

  await logAudit({
    actorId: userId,
    action: existed ? 'BANK_DETAILS_UPDATED' : 'BANK_DETAILS_CREATED',
    entity: 'freelancer_payment_details',
    entityId: profile.id,
    // Never log the full account number — only which fields changed and a
    // masked reference, so the audit trail stays useful without becoming a
    // second place a leaked account number could be read from.
    newValue: {
      fieldsUpdated: Object.keys(fields).filter((key) => fields[key] !== undefined),
      bankAccountNumberMasked: maskAccountNumber(updated.bank_account_number),
    },
    req,
  })

  return toSafePaymentDetails(updated)
}

export async function listMyPayments(userId) {
  const profile = await requireProfile(userId)
  return listPaymentsForFreelancer(profile.id)
}

export async function getMyLevelHistory(userId) {
  const profile = await requireProfile(userId)
  return listLevelHistory(profile.id)
}

// ---- Closed deal / commission contract submission ----

function toRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/')
}

export async function getMyDealForLead(leadId, userId) {
  const profile = await requireProfile(userId)
  const lead = await findLeadByIdForUpdate(leadId)
  if (!lead || lead.assigned_freelancer_id !== profile.id) {
    throw new ApiError(404, 'Lead not found')
  }
  const commission = await findCommissionByLeadId(leadId)
  return commission && commission.freelancer_id === profile.id ? commission : null
}

/**
 * Freelancer-initiated "Submit Closed Deal" action. This is not a second
 * commission engine — it reuses the exact same commission_rules lookup and
 * calculateCommissionAmount() the admin-initiated path
 * (adminCommissionService.createCommissionForLead) uses, so the two paths
 * can never disagree on how a commission amount is derived. The only
 * difference is who is allowed to trigger row creation and what metadata
 * (declaration note, optional supporting document) gets captured with it.
 *
 * A REJECTED commission for the same lead is resubmitted onto the same row
 * (the lead_id UNIQUE constraint means there can only ever be one). Any
 * other existing status blocks a second submission outright.
 */
export async function submitClosedDeal(leadId, userId, { declarationNote, termsAccepted, dealClosingDate }, file, req) {
  const profile = await requireProfile(userId)

  const connection = await pool.getConnection()
  let commissionId
  let lead
  let rule
  let commissionAmount
  let isResubmission

  try {
    await connection.beginTransaction()

    lead = await findLeadByIdForUpdate(leadId, connection)
    if (!lead || lead.assigned_freelancer_id !== profile.id) {
      throw new ApiError(404, 'Lead not found')
    }
    if (lead.status !== 'CONVERTED') {
      throw new ApiError(409, 'Only a lead marked Converted is eligible for a closed-deal submission')
    }
    if (!lead.conversion_value || Number(lead.conversion_value) <= 0) {
      throw new ApiError(409, 'This lead has no conversion value set — update the lead before submitting')
    }

    const existing = await findCommissionByLeadId(leadId, connection)
    isResubmission = Boolean(existing && existing.status === 'REJECTED')
    if (existing && !isResubmission) {
      throw new ApiError(409, `A closed deal has already been submitted for this lead (status: ${existing.status})`)
    }

    rule = await findActiveRuleByService(lead.service_interested ?? '', connection)
    if (!rule) {
      throw new ApiError(
        422,
        `No active commission rule found for service "${lead.service_interested ?? 'unspecified'}". Ask an admin to configure one first.`
      )
    }

    // Commission amount is always derived server-side from the lead's own
    // conversion_value and the active rule — nothing from the request body
    // ever feeds into this calculation.
    commissionAmount = calculateCommissionAmount(lead.conversion_value, rule.rate_type, rule.rate_value)
    const supportingDocumentPath = file ? toRelativePath(file.path) : null

    if (isResubmission) {
      commissionId = existing.id
      await resubmitCommission(
        commissionId,
        {
          commissionRuleId: rule.id,
          ruleServiceName: rule.service_name,
          ruleRateType: rule.rate_type,
          ruleRateValue: rule.rate_value,
          saleValue: lead.conversion_value,
          commissionAmount,
          declarationNote,
          termsAccepted,
          dealClosingDate,
          supportingDocumentPath: supportingDocumentPath ?? existing.supporting_document_path,
        },
        connection
      )
    } else {
      commissionId = await createCommissionModel(
        {
          leadId,
          freelancerId: profile.id,
          commissionRuleId: rule.id,
          ruleServiceName: rule.service_name,
          ruleRateType: rule.rate_type,
          ruleRateValue: rule.rate_value,
          saleValue: lead.conversion_value,
          commissionAmount,
          declarationNote,
          termsAccepted,
          dealClosingDate,
          supportingDocumentPath,
          createdBy: userId,
        },
        connection
      )
    }

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await logAudit({
    actorId: userId,
    action: isResubmission ? 'DEAL_RESUBMITTED' : 'DEAL_SUBMITTED',
    entity: 'commission',
    entityId: commissionId,
    newValue: { leadId, commissionAmount, ruleId: rule.id },
    req,
  })

  notifyAdmins({
    type: 'COMMISSION_STATUS_CHANGED',
    title: isResubmission ? 'Closed deal resubmitted' : 'New closed deal submitted',
    message: `${profile.full_name} submitted a closed deal for ${lead.client_name} (${lead.lead_number}) — ₹${commissionAmount} pending review.`,
    relatedEntityType: 'commission',
    relatedEntityId: commissionId,
  }).catch((error) => console.error('[freelancerCommissionService] Failed to notify admins of deal submission:', error.message))

  return findCommissionDetailById(commissionId)
}
