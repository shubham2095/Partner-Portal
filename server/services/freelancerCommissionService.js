import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import {
  findCommissionDetailById,
  listCommissionsForFreelancer,
  getFreelancerCommissionSummary,
} from '../models/commissionModel.js'
import { findPaymentByCommissionId, listPaymentsForFreelancer } from '../models/paymentModel.js'
import {
  findPaymentDetailsByFreelancerId,
  upsertPaymentDetails,
} from '../models/freelancerPaymentDetailsModel.js'
import { listLevelHistory } from '../models/partnerLevelModel.js'

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
  return findPaymentDetailsByFreelancerId(profile.id)
}

export async function updateMyPaymentDetails(userId, fields) {
  const profile = await requireProfile(userId)
  return upsertPaymentDetails(profile.id, fields)
}

export async function listMyPayments(userId) {
  const profile = await requireProfile(userId)
  return listPaymentsForFreelancer(profile.id)
}

export async function getMyLevelHistory(userId) {
  const profile = await requireProfile(userId)
  return listLevelHistory(profile.id)
}
