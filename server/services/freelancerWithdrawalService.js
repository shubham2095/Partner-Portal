import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import { findPaymentDetailsByFreelancerId } from '../models/freelancerPaymentDetailsModel.js'
import {
  createWithdrawal as createWithdrawalModel,
  findWithdrawalById,
  findCommissionsByWithdrawal,
  lockAvailableCommissions,
  linkCommissionsToWithdrawal,
  getAvailableBalance,
  getWithdrawalSummary,
  listWithdrawalsForFreelancer,
} from '../models/withdrawalModel.js'
import { logAudit } from './auditService.js'
import { notifyAdmins } from './notificationService.js'

async function requireProfile(userId) {
  const profile = await findProfileByUserId(userId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }
  return profile
}

export async function getMyAvailableBalance(userId) {
  const profile = await requireProfile(userId)
  return getAvailableBalance(profile.id)
}

export async function getMyWithdrawalSummary(userId) {
  const profile = await requireProfile(userId)
  const rows = await getWithdrawalSummary(profile.id)
  const byStatus = new Map(rows.map((row) => [row.status, { count: row.count, total: Number(row.total) }]))
  const sum = (statuses) => statuses.reduce((total, status) => total + (byStatus.get(status)?.total ?? 0), 0)

  return {
    availableBalance: await getAvailableBalance(profile.id),
    pendingWithdrawal: sum(['PENDING', 'APPROVED']),
    paidWithdrawal: sum(['PAID']),
    rejectedWithdrawal: sum(['REJECTED']),
  }
}

/**
 * Creates a withdrawal request and reserves just enough of the freelancer's
 * unreserved PAYABLE commissions (oldest first) to cover it — see
 * withdrawalModel.lockAvailableCommissions. This never over-reserves: if the
 * requested amount can't be matched exactly by whole commissions, the
 * reserved (and returned) amount is the largest achievable total that does
 * not exceed what was requested, so a freelancer can never be short-changed
 * relative to what they asked for.
 */
export async function requestWithdrawal(userId, amount, req) {
  const profile = await requireProfile(userId)

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(422, 'Withdrawal amount must be a positive number')
  }

  const paymentDetails = await findPaymentDetailsByFreelancerId(profile.id)
  if (!paymentDetails || !paymentDetails.bank_account_number || !paymentDetails.ifsc_code) {
    throw new ApiError(409, 'Add or update your bank/payment details before requesting a withdrawal')
  }

  const connection = await pool.getConnection()
  let withdrawalId
  let reservedAmount = 0

  try {
    await connection.beginTransaction()

    // Row-locks every unreserved PAYABLE commission for this freelancer —
    // this is what makes two concurrent withdrawal requests safe: the
    // second request's lock acquisition blocks until the first transaction
    // commits or rolls back, so they can never both reserve the same
    // commission or double-count the same balance.
    const candidates = await lockAvailableCommissions(profile.id, connection)
    const available = candidates.reduce((sum, c) => sum + Number(c.commission_amount), 0)

    if (amount > available) {
      throw new ApiError(409, `Requested amount exceeds your available balance of ₹${available}.`)
    }

    const selected = []
    for (const commission of candidates) {
      const amt = Number(commission.commission_amount)
      if (reservedAmount + amt > amount) continue
      selected.push(commission)
      reservedAmount += amt
      if (reservedAmount === amount) break
    }

    if (reservedAmount <= 0) {
      throw new ApiError(
        409,
        `Requested amount could not be matched against available commissions. Available balance is ₹${available}.`
      )
    }

    withdrawalId = await createWithdrawalModel({ freelancerId: profile.id, amount: reservedAmount }, connection)
    await linkCommissionsToWithdrawal(
      selected.map((c) => c.id),
      withdrawalId,
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
    actorId: userId,
    action: 'WITHDRAWAL_REQUESTED',
    entity: 'withdrawal_request',
    entityId: withdrawalId,
    newValue: { freelancerId: profile.id, amount: reservedAmount },
    req,
  })

  notifyAdmins({
    type: 'COMMISSION_STATUS_CHANGED',
    title: 'New withdrawal request',
    message: `${profile.full_name} requested a withdrawal of ₹${reservedAmount}.`,
    relatedEntityType: 'withdrawal_request',
    relatedEntityId: withdrawalId,
  }).catch((error) => console.error('[freelancerWithdrawalService] Failed to notify admins:', error.message))

  return findWithdrawalById(withdrawalId)
}

export async function listMyWithdrawals(userId, query) {
  const profile = await requireProfile(userId)
  const { rows, total } = await listWithdrawalsForFreelancer({ ...query, freelancerId: profile.id })
  return { rows, total, page: query.page, limit: query.limit }
}

export async function getMyWithdrawalDetail(id, userId) {
  const profile = await requireProfile(userId)
  const withdrawal = await findWithdrawalById(id)
  if (!withdrawal || withdrawal.freelancer_id !== profile.id) {
    throw new ApiError(404, 'Withdrawal request not found')
  }
  const commissions = await findCommissionsByWithdrawal(id)
  return { withdrawal, commissions }
}
