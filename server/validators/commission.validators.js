import { param, query, body } from 'express-validator'

const RATE_TYPES = ['PERCENTAGE', 'FIXED']
const RULE_STATUSES = ['ACTIVE', 'INACTIVE']
const COMMISSION_STATUSES = ['POTENTIAL', 'EARNED', 'APPROVED', 'PAYABLE', 'PAID', 'REJECTED']
const PARTNER_LEVELS = ['STARTER', 'CERTIFIED_PARTNER', 'PREMIUM_PARTNER', 'ELITE_PARTNER']
const ACCOUNT_TYPES = ['SAVINGS', 'CURRENT']

// Standard Indian banking formats — not invented, these are the fixed
// government/NPCI-defined formats (IFSC: RBI, PAN: Income Tax Dept, UPI: NPCI).
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const UPI_PATTERN = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
const ACCOUNT_NUMBER_PATTERN = /^[0-9]{9,18}$/

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

export const rejectCommissionValidator = [
  body('reason').trim().notEmpty().withMessage('A rejection reason is required').isLength({ max: 500 }),
]

// Closed deal submission

export const submitClosedDealValidator = [
  body('declarationNote').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  body('dealClosingDate').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid deal closing date'),
  // multipart bodies deliver this as the string "true"/"false" — a strict
  // boolean check would reject every real request, so both forms are accepted.
  body('termsAccepted')
    .custom((value) => value === true || value === 'true')
    .withMessage('You must accept the terms & conditions to submit a closed deal'),
]

// Admin: confirm client payment received (see Phase 4 — this is a distinct,
// explicit gate before a commission can be approved, never inferred from
// the lead's CONVERTED status).
export const confirmClientPaymentValidator = []

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
  body('accountHolderName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Account holder name must be 2-150 characters'),
  body('bankName').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 150 }).withMessage('Bank name must be 2-150 characters'),
  body('accountType').optional({ values: 'falsy' }).isIn(ACCOUNT_TYPES).withMessage('Account type must be SAVINGS or CURRENT'),
  body('bankAccountNumber')
    .optional({ values: 'falsy' })
    .trim()
    .matches(ACCOUNT_NUMBER_PATTERN)
    .withMessage('Account number must be 9-18 digits'),
  body('ifscCode')
    .optional({ values: 'falsy' })
    .trim()
    .toUpperCase()
    .matches(IFSC_PATTERN)
    .withMessage('Enter a valid IFSC code (e.g. HDFC0001234)'),
  body('upiId')
    .optional({ values: 'falsy' })
    .trim()
    .matches(UPI_PATTERN)
    .withMessage('Enter a valid UPI ID (e.g. name@bank)'),
  body('panNumber')
    .optional({ values: 'falsy' })
    .trim()
    .toUpperCase()
    .matches(PAN_PATTERN)
    .withMessage('Enter a valid PAN (e.g. ABCDE1234F)'),
  body('gstNumber').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
]

// Partner level

export const changePartnerLevelValidator = [
  body('level').isIn(PARTNER_LEVELS).withMessage('Invalid partner level'),
  body('reason').optional({ values: 'null' }).trim().isLength({ max: 255 }),
]
