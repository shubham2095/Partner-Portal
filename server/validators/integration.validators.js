import { param, query, body } from 'express-validator'

const PROVIDERS = ['META_LEAD_ADS', 'GOOGLE_LEAD_FORMS', 'WHATSAPP', 'SMS', 'RAZORPAY', 'STRIPE', 'S3', 'AUTO_ASSIGNMENT']

export const providerParamValidator = [param('provider').isIn(PROVIDERS).withMessage('Unknown integration provider')]

export const toggleConfigValidator = [body('isEnabled').isBoolean().withMessage('isEnabled must be a boolean')]

export const listWebhookEventsValidator = [
  query('provider').optional().isIn(['META_LEAD_ADS', 'GOOGLE_LEAD_FORMS']),
  query('status').optional().isIn(['RECEIVED', 'PROCESSED', 'REJECTED', 'DUPLICATE']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const listAutomationLogsValidator = [
  query('jobName').optional().trim().isLength({ max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]
