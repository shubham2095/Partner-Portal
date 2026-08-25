import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { createUploadHandler } from '../middleware/uploadHandler.js'
import {
  leadIdParamValidator,
  followUpIdParamValidator,
  listLeadsValidator,
  createLeadValidator,
  changeLeadStatusValidator,
  addActivityValidator,
  listFollowUpsValidator,
  createFollowUpValidator,
  updateFollowUpValidator,
  completeFollowUpValidator,
} from '../validators/lead.validators.js'
import { submitClosedDealValidator } from '../validators/commission.validators.js'
import * as freelancerLeadController from '../controllers/freelancerLeadController.js'

const router = Router()
const uploadDealDocument = createUploadHandler('deal-documents')

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
router.post('/', createLeadValidator, validateRequest, freelancerLeadController.createMyLead)
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
router.get('/:id/closed-deal', leadIdParamValidator, validateRequest, freelancerLeadController.getMyClosedDeal)
router.post(
  '/:id/closed-deal',
  leadIdParamValidator,
  uploadDealDocument.single('document'),
  submitClosedDealValidator,
  validateRequest,
  freelancerLeadController.submitClosedDeal
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
