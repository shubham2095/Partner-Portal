import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  listWebinarsValidator,
  webinarIdParamValidator,
  createWebinarValidator,
  updateWebinarValidator,
  changeWebinarStatusValidator,
  listRegistrationsValidator,
  registrationIdParamValidator,
  markAttendanceValidator,
} from '../validators/webinar.validators.js'
import * as adminWebinarController from '../controllers/adminWebinarController.js'

const router = Router()

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

router.get('/', listWebinarsValidator, validateRequest, adminWebinarController.listWebinars)
router.post('/', createWebinarValidator, validateRequest, adminWebinarController.createWebinar)
router.get('/:id', webinarIdParamValidator, validateRequest, adminWebinarController.getWebinarDetail)
router.patch(
  '/:id',
  webinarIdParamValidator,
  updateWebinarValidator,
  validateRequest,
  adminWebinarController.updateWebinar
)
router.post(
  '/:id/status',
  webinarIdParamValidator,
  changeWebinarStatusValidator,
  validateRequest,
  adminWebinarController.changeWebinarStatus
)
router.get(
  '/:id/registrations',
  webinarIdParamValidator,
  listRegistrationsValidator,
  validateRequest,
  adminWebinarController.listWebinarRegistrations
)
router.post(
  '/:id/registrations/:registrationId/attendance',
  webinarIdParamValidator,
  registrationIdParamValidator,
  markAttendanceValidator,
  validateRequest,
  adminWebinarController.markAttendance
)

export default router
