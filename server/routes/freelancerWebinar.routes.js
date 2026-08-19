import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  listWebinarsValidator,
  webinarIdParamValidator,
  registerWebinarValidator,
} from '../validators/webinar.validators.js'
import * as freelancerWebinarController from '../controllers/freelancerWebinarController.js'

const router = Router()

router.use(authenticate, authorizeRole('FREELANCER'))

router.get('/', listWebinarsValidator, validateRequest, freelancerWebinarController.listAvailableWebinars)
router.get('/registrations', freelancerWebinarController.listMyRegistrations)
router.get('/:id', webinarIdParamValidator, validateRequest, freelancerWebinarController.getWebinarDetail)
router.post(
  '/:id/register',
  webinarIdParamValidator,
  registerWebinarValidator,
  validateRequest,
  freelancerWebinarController.registerForWebinar
)

export default router
