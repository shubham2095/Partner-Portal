import { param, query, body } from 'express-validator'

const RATE_TYPES = ['PERCENTAGE', 'FIXED']
const RULE_STATUSES = ['ACTIVE', 'INACTIVE']
const COMMISSION_STATUSES = ['POTENTIAL', 'EARNED', 'APPROVED', 'PAYABLE', 'PAID']
const PARTNER_LEVELS = ['STARTER', 'CERTIFIED_PARTNER', 'PREMIUM_PARTNER', 'ELITE_PARTNER']

export const commissionIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid commission id')]
export const ruleIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid commission rule id')]
export const freelancerIdParamValidator = [param('freelancerId').isInt({ min: 1 }).withMessage('Invalid freelancer id')]

// Commission rules

export const listRulesValidator = [
  query('status').optional().isIn(RULE_STATUSES),
  query('search').optional().trim().isLength({ max: 150 }),
]

export const createRuleValidator = [
  body('serviceName').trim().notEmpty().withMessage('Service name is required').isLength({ max: 150 }),
  body('rateType').isIn(RATE_TYPES).withMessage('Invalid rate type'),
  body('rateValue').isFloat({ min: 0 }).withMessage('rateValue must be a non-negative number'),
]

export const changeRuleStatusValidator = [body('status').isIn(RULE_STATUSES).withMessage('Invalid rule status')]

// Commissions

export const listCommissionsValidator = [
  query('status').optional().isIn(COMMISSION_STATUSES),
  query('freelancerId').optional().isInt({ min: 1 }),
  query('search').optional().trim().isLength({ max: 150 }),
  query('sortBy').optional().isIn(['created_at', 'commission_amount', 'sale_value', 'status']),
  query('sortDir').optional().isIn(['ASC', 'DESC']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const listMyCommissionsValidator = [
  query('status').optional().isIn(COMMISSION_STATUSES),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const createCommissionValidator = [body('leadId').isInt({ min: 1 }).withMessage('leadId is required')]

export const changeCommissionStatusValidator = [
  body('status').isIn(COMMISSION_STATUSES).withMessage('Invalid commission status'),
]

// Payments

export const listPaymentsValidator = [
  query('freelancerId').optional().isInt({ min: 1 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const createPaymentValidator = [
  body('paymentDate').isISO8601().withMessage('A valid payment date is required'),
  body('transactionReference').optional({ values: 'null' }).trim().isLength({ max: 150 }),
]

// Freelancer payment details

export const updatePaymentDetailsValidator = [
  body('accountHolderName').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('bankAccountNumber').optional({ values: 'null' }).trim().isLength({ max: 50 }),
  body('ifscCode').optional({ values: 'null' }).trim().isLength({ max: 20 }),
  body('upiId').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('panNumber').optional({ values: 'null' }).trim().isLength({ max: 20 }),
  body('gstNumber').optional({ values: 'null' }).trim().isLength({ max: 30 }),
]

// Partner level

export const changePartnerLevelValidator = [
  body('level').isIn(PARTNER_LEVELS).withMessage('Invalid partner level'),
  body('reason').optional({ values: 'null' }).trim().isLength({ max: 255 }),
]
