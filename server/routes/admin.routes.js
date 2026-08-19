import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  listFreelancersValidator,
  freelancerIdParamValidator,
  documentIdParamValidator,
  rejectProfileValidator,
} from '../validators/admin.validators.js'
import * as adminFreelancerController from '../controllers/adminFreelancerController.js'

const router = Router()

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

router.get('/freelancers', listFreelancersValidator, validateRequest, adminFreelancerController.listFreelancers)
router.get(
  '/freelancers/:id',
  freelancerIdParamValidator,
  validateRequest,
  adminFreelancerController.getFreelancerDetail
)
router.post(
  '/freelancers/:id/verify',
  freelancerIdParamValidator,
  validateRequest,
  adminFreelancerController.verifyFreelancerProfile
)
router.post(
  '/freelancers/:id/reject',
  freelancerIdParamValidator,
  rejectProfileValidator,
  validateRequest,
  adminFreelancerController.rejectFreelancerProfile
)
router.post(
  '/freelancers/:id/activate',
  freelancerIdParamValidator,
  validateRequest,
  adminFreelancerController.activateFreelancerAccount
)
router.post(
  '/freelancers/:id/suspend',
  freelancerIdParamValidator,
  validateRequest,
  adminFreelancerController.suspendFreelancerAccount
)
router.post(
  '/documents/:documentId/verify',
  documentIdParamValidator,
  validateRequest,
  adminFreelancerController.verifyFreelancerDocument
)
router.post(
  '/documents/:documentId/reject',
  documentIdParamValidator,
  validateRequest,
  adminFreelancerController.rejectFreelancerDocument
)

export default router
