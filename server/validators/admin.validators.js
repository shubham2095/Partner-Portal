import { param, query, body } from 'express-validator'

const PROFILE_STATUSES = [
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'QUALIFIED',
  'CERTIFIED',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
]

export const listFreelancersValidator = [
  query('status').optional().isIn(PROFILE_STATUSES).withMessage('Invalid status filter'),
  query('search').optional().trim().isLength({ max: 150 }),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  // Cap allows admin screens that load the whole roster into a picker
  // (Reports "All Freelancers", lead assignment, etc.) to request it in one call.
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500'),
]

export const freelancerIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid freelancer id'),
]

export const documentIdParamValidator = [
  param('documentId').isInt({ min: 1 }).withMessage('Invalid document id'),
]

export const rejectProfileValidator = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('A rejection reason is required')
    .isLength({ max: 500 })
    .withMessage('Rejection reason must be 500 characters or fewer'),
]
