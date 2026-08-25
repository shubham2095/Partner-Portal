import path from 'node:path'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as freelancerCommissionService from '../services/freelancerCommissionService.js'

export const listMyCommissions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const result = await freelancerCommissionService.listMyCommissions(req.user.id, {
    status,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Your commissions retrieved',
    data: { commissions: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getMyCommissionDetail = asyncHandler(async (req, res) => {
  const detail = await freelancerCommissionService.getMyCommissionDetail(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Commission detail retrieved', data: detail })
})

export const downloadMyContract = asyncHandler(async (req, res) => {
  const contractPath = await freelancerCommissionService.getMyContractPath(Number(req.params.id), req.user.id)
  if (!contractPath) {
    return res.status(404).json({ success: false, message: 'No contract document available yet', errors: {} })
  }
  const absolutePath = path.join(process.cwd(), contractPath)
  res.download(absolutePath, `contract-${req.params.id}.pdf`)
})

export const getMyEarningsSummary = asyncHandler(async (req, res) => {
  const summary = await freelancerCommissionService.getMyEarningsSummary(req.user.id)
  sendSuccess(res, { message: 'Earnings summary retrieved', data: summary })
})

export const getMyPaymentDetails = asyncHandler(async (req, res) => {
  const paymentDetails = await freelancerCommissionService.getMyPaymentDetails(req.user.id)
  sendSuccess(res, { message: 'Payment details retrieved', data: { paymentDetails } })
})

export const updateMyPaymentDetails = asyncHandler(async (req, res) => {
  const fields = {}
  for (const key of ['accountHolderName', 'bankName', 'bankAccountNumber', 'accountType', 'ifscCode', 'upiId', 'panNumber', 'gstNumber']) {
    if (req.body[key] !== undefined) fields[key] = req.body[key]
  }
  const paymentDetails = await freelancerCommissionService.updateMyPaymentDetails(req.user.id, fields, req)
  sendSuccess(res, { message: 'Payment details saved', data: { paymentDetails } })
})

export const listMyPayments = asyncHandler(async (req, res) => {
  const payments = await freelancerCommissionService.listMyPayments(req.user.id)
  sendSuccess(res, { message: 'Payments retrieved', data: { payments } })
})

export const getMyLevelHistory = asyncHandler(async (req, res) => {
  const history = await freelancerCommissionService.getMyLevelHistory(req.user.id)
  sendSuccess(res, { message: 'Partner level history retrieved', data: { history } })
})
