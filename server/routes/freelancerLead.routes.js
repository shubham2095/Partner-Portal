import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  leadIdParamValidator,
  followUpIdParamValidator,
  listLeadsValidator,
  changeLeadStatusValidator,
  addActivityValidator,
  listFollowUpsValidator,
  createFollowUpValidator,
  updateFollowUpValidator,
  completeFollowUpValidator,
} from '../validators/lead.validators.js'
import * as freelancerLeadController from '../controllers/freelancerLeadController.js'

const router = Router()

router.use(authenticate, authorizeRole('FREELANCER'))

router.get('/followups', listFollowUpsValidator, validateRequest, freelancerLeadController.listFollowUps)
router.patch(
  '/followups/:followUpId',
  followUpIdParamValidator,
  updateFollowUpValidator,
  validateRequest,
  freelancerLeadController.updateFollowUp
)
router.post(
  '/followups/:followUpId/complete',
  followUpIdParamValidator,
  completeFollowUpValidator,
  validateRequest,
  freelancerLeadController.completeFollowUp
)
router.post(
  '/followups/:followUpId/cancel',
  followUpIdParamValidator,
  validateRequest,
  freelancerLeadController.cancelFollowUp
)

router.get('/', listLeadsValidator, validateRequest, freelancerLeadController.listMyLeads)
router.get('/:id', leadIdParamValidator, validateRequest, freelancerLeadController.getMyLeadDetail)
router.post(
  '/:id/status',
  leadIdParamValidator,
  changeLeadStatusValidator,
  validateRequest,
  freelancerLeadController.changeMyLeadStatus
)
router.get('/:id/timeline', leadIdParamValidator, validateRequest, freelancerLeadController.getMyLeadTimeline)
router.post(
  '/:id/activities',
  leadIdParamValidator,
  addActivityValidator,
  validateRequest,
  freelancerLeadController.addMyActivity
)
router.get('/:id/followups', leadIdParamValidator, validateRequest, freelancerLeadController.listFollowUpsForLead)
router.post(
  '/:id/followups',
  leadIdParamValidator,
  createFollowUpValidator,
  validateRequest,
  freelancerLeadController.createFollowUp
)

export default router
