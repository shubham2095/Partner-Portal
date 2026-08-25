import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { createUploadHandler } from '../middleware/uploadHandler.js'
import {
  ticketIdParamValidator,
  attachmentIdParamValidator,
  createTicketValidator,
  replyValidator,
  listMyTicketsValidator,
} from '../validators/ticket.validators.js'
import * as freelancerTicketController from '../controllers/freelancerTicketController.js'

const router = Router()
const uploadAttachment = createUploadHandler('ticket-attachments')

router.use(authenticate, authorizeRole('FREELANCER'))

router.get('/counts', freelancerTicketController.getMyTicketCounts)
router.get('/', listMyTicketsValidator, validateRequest, freelancerTicketController.listMyTickets)
router.post(
  '/',
  uploadAttachment.single('attachment'),
  createTicketValidator,
  validateRequest,
  freelancerTicketController.createMyTicket
)
router.get('/:id', ticketIdParamValidator, validateRequest, freelancerTicketController.getMyTicketDetail)
router.post(
  '/:id/replies',
  ticketIdParamValidator,
  uploadAttachment.single('attachment'),
  replyValidator,
  validateRequest,
  freelancerTicketController.replyToMyTicket
)
router.get(
  '/:id/attachments/:attachmentId',
  ticketIdParamValidator,
  attachmentIdParamValidator,
  validateRequest,
  freelancerTicketController.downloadMyAttachment
)

export default router
