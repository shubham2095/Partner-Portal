import path from 'node:path'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as adminCommissionService from '../services/adminCommissionService.js'
import * as partnerLevelService from '../services/partnerLevelService.js'

// Commission rules

export const listRules = asyncHandler(async (req, res) => {
  const rules = await adminCommissionService.listRules({ status: req.query.status, search: req.query.search })
  sendSuccess(res, { message: 'Commission rules retrieved', data: { rules } })
})

export const createRule = asyncHandler(async (req, res) => {
  const rule = await adminCommissionService.createRule(
    { serviceName: req.body.serviceName, rateType: req.body.rateType, rateValue: req.body.rateValue },
    req.user.id,
    req
  )
  sendSuccess(res, { statusCode: 201, message: 'Commission rule created', data: { rule } })
})

export const changeRuleStatus = asyncHandler(async (req, res) => {
  const rule = await adminCommissionService.changeRuleStatus(Number(req.params.id), req.body.status, req.user.id, req)
  sendSuccess(res, { message: 'Commission rule status updated', data: { rule } })
})

// Commissions

export const listCommissions = asyncHandler(async (req, res) => {
  const { status, freelancerId, search, sortBy, sortDir, page = 1, limit = 20 } = req.query
  const result = await adminCommissionService.listCommissions({
    status,
    freelancerId: freelancerId ? Number(freelancerId) : undefined,
    search,
    sortBy,
    sortDir,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Commissions retrieved',
    data: { commissions: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const createCommission = asyncHandler(async (req, res) => {
  const detail = await adminCommissionService.createCommissionForLead(Number(req.body.leadId), req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Commission created', data: { commission: detail } })
})

export const getCommissionDetail = asyncHandler(async (req, res) => {
  const detail = await adminCommissionService.getCommissionDetail(Number(req.params.id))
  sendSuccess(res, { message: 'Commission detail retrieved', data: detail })
})

export const changeCommissionStatus = asyncHandler(async (req, res) => {
  const commission = await adminCommissionService.changeCommissionStatus(
    Number(req.params.id),
    req.body.status,
    req.user.id,
    req
  )
  sendSuccess(res, { message: 'Commission status updated', data: { commission } })
})

// Payments

export const createPayment = asyncHandler(async (req, res) => {
  const detail = await adminCommissionService.createPayment(
    Number(req.params.id),
    { paymentDate: req.body.paymentDate, transactionReference: req.body.transactionReference },
    req.file,
    req.user.id,
    req
  )
  sendSuccess(res, { statusCode: 201, message: 'Payment recorded and commission marked paid', data: detail })
})

export const listPayments = asyncHandler(async (req, res) => {
  const { freelancerId, page = 1, limit = 20 } = req.query
  const result = await adminCommissionService.listPayments({
    freelancerId: freelancerId ? Number(freelancerId) : undefined,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Payments retrieved',
    data: { payments: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const downloadPaymentProof = asyncHandler(async (req, res) => {
  const { commission, payment } = await adminCommissionService.getCommissionDetail(Number(req.params.id))
  if (!payment?.payment_proof_path) {
    return res.status(404).json({ success: false, message: 'No payment proof available', errors: {} })
  }
  const absolutePath = path.join(process.cwd(), payment.payment_proof_path)
  res.download(absolutePath, `payment-proof-${commission.id}${path.extname(payment.payment_proof_path)}`)
})

// Freelancer payment details (admin read-only view)

export const getFreelancerPaymentDetails = asyncHandler(async (req, res) => {
  const paymentDetails = await adminCommissionService.getFreelancerPaymentDetails(Number(req.params.freelancerId))
  sendSuccess(res, { message: 'Payment details retrieved', data: { paymentDetails } })
})

// Partner level

export const changePartnerLevel = asyncHandler(async (req, res) => {
  const profile = await partnerLevelService.changePartnerLevel(
    Number(req.params.freelancerId),
    req.body.level,
    req.body.reason,
    req.user.id,
    req
  )
  sendSuccess(res, { message: 'Partner level updated', data: { profile } })
})

export const getLevelHistory = asyncHandler(async (req, res) => {
  const history = await partnerLevelService.getLevelHistory(Number(req.params.freelancerId))
  sendSuccess(res, { message: 'Partner level history retrieved', data: { history } })
})
