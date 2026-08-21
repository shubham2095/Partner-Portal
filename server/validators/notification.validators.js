import { param, query, body } from 'express-validator'

export const notificationIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid notification id')]

export const listNotificationsValidator = [
  query('unreadOnly').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const updatePreferencesValidator = [
  body('emailEnabled').optional().isBoolean(),
  body('whatsappEnabled').optional().isBoolean(),
]
