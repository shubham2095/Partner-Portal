import { query, param } from 'express-validator'

const REPORT_TYPES = [
  'freelancer',
  'lead',
  'sales',
  'revenue',
  'commission',
  'webinar',
  'conversion',
  'lost-leads',
  'withdrawal',
  'follow-up',
  'course',
  'ticket',
]

export const dateRangeValidator = [
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO date'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO date'),
  query('dateFrom').custom((value, { req }) => {
    if (value && req.query.dateTo && new Date(value) > new Date(req.query.dateTo)) {
      throw new Error('dateFrom must not be after dateTo')
    }
    if (value && req.query.dateTo) {
      const rangeMs = new Date(req.query.dateTo) - new Date(value)
      const maxRangeMs = 366 * 24 * 60 * 60 * 1000
      if (rangeMs > maxRangeMs) {
        throw new Error('Date range cannot exceed 366 days')
      }
    }
    return true
  }),
]

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const reportTypeParamValidator = [param('type').isIn(REPORT_TYPES).withMessage('Unknown report type')]

export const reportFilterValidator = [
  query('freelancerId').optional().isInt({ min: 1 }),
  query('status').optional().trim().isLength({ max: 30 }),
]

export const webinarIdQueryValidator = [query('webinarId').optional().isInt({ min: 1 })]
