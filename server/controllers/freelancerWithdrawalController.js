import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as freelancerWithdrawalService from '../services/freelancerWithdrawalService.js'

export const getMyAvailableBalance = asyncHandler(async (req, res) => {
  const availableBalance = await freelancerWithdrawalService.getMyAvailableBalance(req.user.id)
  sendSuccess(res, { message: 'Available balance retrieved', data: { availableBalance } })
})

export const getMyWithdrawalSummary = asyncHandler(async (req, res) => {
  const summary = await freelancerWithdrawalService.getMyWithdrawalSummary(req.user.id)
  sendSuccess(res, { message: 'Withdrawal summary retrieved', data: summary })
})

export const createWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await freelancerWithdrawalService.requestWithdrawal(req.user.id, Number(req.body.amount), req)
  sendSuccess(res, { statusCode: 201, message: 'Withdrawal request submitted', data: { withdrawal } })
})

export const listMyWithdrawals = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const result = await freelancerWithdrawalService.listMyWithdrawals(req.user.id, {
    status,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Your withdrawal requests retrieved',
    data: { withdrawals: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getMyWithdrawalDetail = asyncHandler(async (req, res) => {
  const detail = await freelancerWithdrawalService.getMyWithdrawalDetail(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Withdrawal detail retrieved', data: detail })
})
