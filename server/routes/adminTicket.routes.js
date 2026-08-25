import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { createUploadHandler } from '../middleware/uploadHandler.js'
import {
  ticketIdParamValidator,
  attachmentIdParamValidator,
  replyValidator,
  listTicketsValidator,
  assignTicketValidator,
  changeStatusValidator,
  changePriorityValidator,
} from '../validators/ticket.validators.js'
import * as adminTicketController from '../controllers/adminTicketController.js'

const router = Router()
const uploadAttachment = createUploadHandler('ticket-attachments')

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

router.get('/dashboard-counts', adminTicketController.getDashboardCounts)
router.get('/assignable-admins', adminTicketController.listAssignableAdmins)
router.get('/', listTicketsValidator, validateRequest, adminTicketController.listTickets)
router.get('/:id', ticketIdParamValidator, validateRequest, adminTicketController.getTicketDetail)
router.post(
  '/:id/assign',
  ticketIdParamValidator,
  assignTicketValidator,
  validateRequest,
  adminTicketController.assignTicket
)
router.post(
  '/:id/status',
  ticketIdParamValidator,
  changeStatusValidator,
  validateRequest,
  adminTicketController.changeStatus
)
router.post(
  '/:id/priority',
  ticketIdParamValidator,
  changePriorityValidator,
  validateRequest,
  adminTicketController.changePriority
)
router.post(
  '/:id/replies',
  ticketIdParamValidator,
  uploadAttachment.single('attachment'),
  replyValidator,
  validateRequest,
  adminTicketController.replyToTicket
)
router.get(
  '/:id/attachments/:attachmentId',
  ticketIdParamValidator,
  attachmentIdParamValidator,
  validateRequest,
  adminTicketController.downloadAttachment
)

export default router
