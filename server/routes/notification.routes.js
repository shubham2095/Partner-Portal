import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  notificationIdParamValidator,
  listNotificationsValidator,
  updatePreferencesValidator,
} from '../validators/notification.validators.js'
import * as notificationController from '../controllers/notificationController.js'

const router = Router()

router.use(authenticate)

router.get('/unread-count', notificationController.getUnreadCount)
router.get('/preferences', notificationController.getMyPreferences)
router.put('/preferences', updatePreferencesValidator, validateRequest, notificationController.updateMyPreferences)
router.post('/read-all', notificationController.markAllRead)
router.get('/', listNotificationsValidator, validateRequest, notificationController.listMyNotifications)
router.post('/:id/read', notificationIdParamValidator, validateRequest, notificationController.markRead)

export default router
