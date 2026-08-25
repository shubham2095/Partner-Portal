import { param, query, body } from 'express-validator'

const WITHDRAWAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'PAID']

export const withdrawalIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid withdrawal id')]

export const createWithdrawalValidator = [
  body('amount').isFloat({ gt: 0 }).withMessage('Withdrawal amount must be a positive number'),
]

export const listMyWithdrawalsValidator = [
  query('status').optional().isIn(WITHDRAWAL_STATUSES),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const listWithdrawalsValidator = [
  query('status').optional().isIn(WITHDRAWAL_STATUSES),
  query('freelancerId').optional().isInt({ min: 1 }),
  query('search').optional().trim().isLength({ max: 150 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const rejectWithdrawalValidator = [
  body('reason').trim().notEmpty().withMessage('A rejection reason is required').isLength({ max: 500 }),
]

export const markWithdrawalPaidValidator = [
  body('transactionReference').trim().notEmpty().withMessage('A transaction reference is required').isLength({ max: 150 }),
  body('paidDate').isISO8601().withMessage('A valid paid date is required'),
  body('adminNote').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
]
