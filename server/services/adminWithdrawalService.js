import path from 'node:path'
import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { findProfileById } from '../models/freelancerProfileModel.js'
import { findPaymentDetailsByFreelancerId } from '../models/freelancerPaymentDetailsModel.js'
import { createPayment as createPaymentModel, findPaymentByCommissionId } from '../models/paymentModel.js'
import {
  findWithdrawalByIdForUpdate,
  findWithdrawalDetailById,
  findCommissionsByWithdrawal,
  updateWithdrawalStatus,
  releaseCommissionsForWithdrawal,
  markLinkedCommissionsPaid,
  listWithdrawalsAdmin,
} from '../models/withdrawalModel.js'
import { logAudit } from './auditService.js'
import { notify } from './notificationService.js'

function maskAccountNumber(accountNumber) {
  if (!accountNumber) return null
  const digits = String(accountNumber)
  if (digits.length <= 4) return digits
  return `${'X'.repeat(digits.length - 4)}${digits.slice(-4)}`
}

export async function listWithdrawals(query) {
  const { rows, total } = await listWithdrawalsAdmin(query)
  return { rows, total, page: query.page, limit: query.limit }
}

export async function getWithdrawalDetail(id) {
  const withdrawal = await findWithdrawalDetailById(id)
  if (!withdrawal) {
    throw new ApiError(404, 'Withdrawal request not found')
  }
  const commissions = await findCommissionsByWithdrawal(id)
  const paymentDetails = await findPaymentDetailsByFreelancerId(withdrawal.freelancer_id)
  const bankDetails = paymentDetails
    ? { ...paymentDetails, bank_account_number: undefined, bank_account_number_masked: maskAccountNumber(paymentDetails.bank_account_number) }
    : null
  return { withdrawal, commissions, bankDetails }
}

export async function approveWithdrawal(id, adminId, req) {
  const connection = await pool.getConnection()
  let withdrawal

  try {
    await connection.beginTransaction()
    withdrawal = await findWithdrawalByIdForUpdate(id, connection)
    if (!withdrawal) {
      throw new ApiError(404, 'Withdrawal request not found')
    }
    if (withdrawal.status !== 'PENDING') {
      throw new ApiError(409, `Only a pending request can be approved (current status: ${withdrawal.status})`)
    }

    await updateWithdrawalStatus(id, { status: 'APPROVED', reviewedBy: adminId, reviewedAt: new Date() }, connection)
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await logAudit({
    actorId: adminId,
    action: 'WITHDRAWAL_APPROVED',
    entity: 'withdrawal_request',
    entityId: id,
    oldValue: { status: 'PENDING' },
    newValue: { status: 'APPROVED', amount: withdrawal.amount },
    req,
  })

  const profile = await findProfileById(withdrawal.freelancer_id)
  notify({
    recipientUserId: profile.user_id,
    type: 'COMMISSION_STATUS_CHANGED',
    title: 'Withdrawal approved',
    message: `Your withdrawal request of ₹${withdrawal.amount} has been approved and will be paid out shortly.`,
    relatedEntityType: 'withdrawal_request',
    relatedEntityId: id,
  }).catch((error) => console.error('[adminWithdrawalService] Failed to notify freelancer of approval:', error.message))

  return findWithdrawalDetailById(id)
}

export async function rejectWithdrawal(id, reason, adminId, req) {
  const connection = await pool.getConnection()
  let withdrawal

  try {
    await connection.beginTransaction()
    withdrawal = await findWithdrawalByIdForUpdate(id, connection)
    if (!withdrawal) {
      throw new ApiError(404, 'Withdrawal request not found')
    }
    if (withdrawal.status !== 'PENDING') {
      throw new ApiError(409, `Only a pending request can be rejected (current status: ${withdrawal.status})`)
    }

    await updateWithdrawalStatus(
      id,
      { status: 'REJECTED', reviewedBy: adminId, reviewedAt: new Date(), rejectionReason: reason },
      connection
    )
    // The reserved commissions return to the available pool immediately —
    // this is the "reject → amount becomes available again" business rule.
    await releaseCommissionsForWithdrawal(id, connection)
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await logAudit({
    actorId: adminId,
    action: 'WITHDRAWAL_REJECTED',
    entity: 'withdrawal_request',
    entityId: id,
    oldValue: { status: 'PENDING' },
    newValue: { status: 'REJECTED', reason },
    req,
  })

  const profile = await findProfileById(withdrawal.freelancer_id)
  notify({
    recipientUserId: profile.user_id,
    type: 'COMMISSION_STATUS_CHANGED',
    title: 'Withdrawal rejected',
    message: `Your withdrawal request of ₹${withdrawal.amount} was rejected: ${reason}`,
    relatedEntityType: 'withdrawal_request',
    relatedEntityId: id,
  }).catch((error) => console.error('[adminWithdrawalService] Failed to notify freelancer of rejection:', error.message))

  return findWithdrawalDetailById(id)
}

function toRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/')
}

/**
 * Records a manual, external payout against an already-approved withdrawal.
 * This never talks to a payment gateway — it is the admin attesting that a
 * bank transfer was already carried out outside the application and is now
 * being logged. Reuses the exact same paymentModel.createPayment +
 * commissionModel-style "mark paid" primitives the pre-existing
 * admin-commission "Record Payment" flow uses, once per reserved commission,
 * so there is exactly one place that ever writes a `payments` row.
 */
export async function markWithdrawalPaid(id, { transactionReference, paidDate, adminNote }, file, adminId, req) {
  const connection = await pool.getConnection()
  let withdrawal
  let commissions

  try {
    await connection.beginTransaction()
    withdrawal = await findWithdrawalByIdForUpdate(id, connection)
    if (!withdrawal) {
      throw new ApiError(404, 'Withdrawal request not found')
    }
    if (withdrawal.status !== 'APPROVED') {
      throw new ApiError(409, `Only an approved request can be marked paid (current status: ${withdrawal.status})`)
    }

    commissions = await findCommissionsByWithdrawal(id, connection)
    const proofPath = file ? toRelativePath(file.path) : null

    for (const commission of commissions) {
      const existingPayment = await findPaymentByCommissionId(commission.id, connection)
      if (existingPayment) continue // defensive; should never happen for a still-APPROVED withdrawal
      await createPaymentModel(
        {
          commissionId: commission.id,
          freelancerId: withdrawal.freelancer_id,
          amount: commission.commission_amount,
          paymentDate: paidDate,
          transactionReference,
          paymentProofPath: proofPath,
          processedBy: adminId,
        },
        connection
      )
    }
    await markLinkedCommissionsPaid(id, connection)

    await updateWithdrawalStatus(
      id,
      { status: 'PAID', transactionReference, paidAt: new Date(), adminNote },
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
    action: 'WITHDRAWAL_PAID',
    entity: 'withdrawal_request',
    entityId: id,
    oldValue: { status: 'APPROVED' },
    newValue: { status: 'PAID', amount: withdrawal.amount, transactionReference },
    req,
  })

  const profile = await findProfileById(withdrawal.freelancer_id)
  notify({
    recipientUserId: profile.user_id,
    type: 'PAYMENT_RECORDED',
    title: 'Withdrawal paid',
    message: `Your withdrawal of ₹${withdrawal.amount} has been paid (ref: ${transactionReference}).`,
    relatedEntityType: 'withdrawal_request',
    relatedEntityId: id,
    emailSubject: 'Withdrawal paid',
    emailHtml: `<p>Your withdrawal of ₹${withdrawal.amount} has been paid.</p><p>Reference: ${transactionReference}</p>`,
  }).catch((error) => console.error('[adminWithdrawalService] Failed to notify freelancer of payout:', error.message))

  return findWithdrawalDetailById(id)
}
