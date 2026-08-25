import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as adminWithdrawalService from '../services/adminWithdrawalService.js'

export const listWithdrawals = asyncHandler(async (req, res) => {
  const { status, freelancerId, search, page = 1, limit = 20 } = req.query
  const result = await adminWithdrawalService.listWithdrawals({
    status,
    freelancerId: freelancerId ? Number(freelancerId) : undefined,
    search,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Withdrawal requests retrieved',
    data: { withdrawals: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getWithdrawalDetail = asyncHandler(async (req, res) => {
  const detail = await adminWithdrawalService.getWithdrawalDetail(Number(req.params.id))
  sendSuccess(res, { message: 'Withdrawal detail retrieved', data: detail })
})

export const approveWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await adminWithdrawalService.approveWithdrawal(Number(req.params.id), req.user.id, req)
  sendSuccess(res, { message: 'Withdrawal approved', data: { withdrawal } })
})

export const rejectWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await adminWithdrawalService.rejectWithdrawal(Number(req.params.id), req.body.reason, req.user.id, req)
  sendSuccess(res, { message: 'Withdrawal rejected', data: { withdrawal } })
})

export const markWithdrawalPaid = asyncHandler(async (req, res) => {
  const withdrawal = await adminWithdrawalService.markWithdrawalPaid(
    Number(req.params.id),
    { transactionReference: req.body.transactionReference, paidDate: req.body.paidDate, adminNote: req.body.adminNote },
    req.file,
    req.user.id,
    req
  )
  sendSuccess(res, { message: 'Withdrawal marked as paid', data: { withdrawal } })
})
