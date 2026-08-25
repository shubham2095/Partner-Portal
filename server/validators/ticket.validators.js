import { param, query, body } from 'express-validator'
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../models/ticketModel.js'

export const ticketIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid ticket id')]
export const attachmentIdParamValidator = [
  param('attachmentId').isInt({ min: 1 }).withMessage('Invalid attachment id'),
]

export const createTicketValidator = [
  body('category').isIn(TICKET_CATEGORIES).withMessage('Invalid category'),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 5000 }),
  body('priority').optional({ values: 'falsy' }).isIn(TICKET_PRIORITIES),
]

export const replyValidator = [
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 5000 }),
]

export const listMyTicketsValidator = [
  query('status').optional().isIn(TICKET_STATUSES),
  query('category').optional().isIn(TICKET_CATEGORIES),
  query('priority').optional().isIn(TICKET_PRIORITIES),
  query('search').optional().trim().isLength({ max: 150 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const listTicketsValidator = [
  query('status').optional().isIn(TICKET_STATUSES),
  query('category').optional().isIn(TICKET_CATEGORIES),
  query('priority').optional().isIn(TICKET_PRIORITIES),
  query('assignedAdminId').optional().isInt({ min: 1 }),
  query('freelancerId').optional().isInt({ min: 1 }),
  query('search').optional().trim().isLength({ max: 150 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const assignTicketValidator = [body('adminId').isInt({ min: 1 }).withMessage('A valid admin id is required')]

export const changeStatusValidator = [body('status').isIn(TICKET_STATUSES).withMessage('Invalid ticket status')]

export const changePriorityValidator = [
  body('priority').isIn(TICKET_PRIORITIES).withMessage('Invalid priority'),
]
