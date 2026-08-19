import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  leadIdParamValidator,
  followUpIdParamValidator,
  listLeadsValidator,
  createLeadValidator,
  updateLeadValidator,
  changeLeadStatusValidator,
  assignLeadValidator,
  addActivityValidator,
  listFollowUpsValidator,
  createFollowUpValidator,
  updateFollowUpValidator,
  completeFollowUpValidator,
} from '../validators/lead.validators.js'
import * as adminLeadController from '../controllers/adminLeadController.js'

const router = Router()

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

router.get('/followups', listFollowUpsValidator, validateRequest, adminLeadController.listFollowUps)
router.patch('/followups/:followUpId', followUpIdParamValidator, updateFollowUpValidator, validateRequest, adminLeadController.updateFollowUp)
router.post(
  '/followups/:followUpId/complete',
  followUpIdParamValidator,
  completeFollowUpValidator,
  validateRequest,
  adminLeadController.completeFollowUp
)
router.post('/followups/:followUpId/cancel', followUpIdParamValidator, validateRequest, adminLeadController.cancelFollowUp)

router.get('/', listLeadsValidator, validateRequest, adminLeadController.listLeads)
router.post('/', createLeadValidator, validateRequest, adminLeadController.createLead)
router.get('/:id', leadIdParamValidator, validateRequest, adminLeadController.getLeadDetail)
router.patch('/:id', leadIdParamValidator, updateLeadValidator, validateRequest, adminLeadController.updateLead)
router.post('/:id/status', leadIdParamValidator, changeLeadStatusValidator, validateRequest, adminLeadController.changeLeadStatus)
router.post('/:id/assign', leadIdParamValidator, assignLeadValidator, validateRequest, adminLeadController.assignLead)
router.get('/:id/timeline', leadIdParamValidator, validateRequest, adminLeadController.getLeadTimeline)
router.post('/:id/activities', leadIdParamValidator, addActivityValidator, validateRequest, adminLeadController.addActivity)
router.get('/:id/followups', leadIdParamValidator, validateRequest, adminLeadController.listFollowUpsForLead)
router.post(
  '/:id/followups',
  leadIdParamValidator,
  createFollowUpValidator,
  validateRequest,
  adminLeadController.createFollowUp
)

export default router
