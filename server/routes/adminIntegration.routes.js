import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  providerParamValidator,
  toggleConfigValidator,
  listWebhookEventsValidator,
  listAutomationLogsValidator,
} from '../validators/integration.validators.js'
import * as adminIntegrationController from '../controllers/adminIntegrationController.js'

const router = Router()

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

router.get('/configs', adminIntegrationController.getConfigs)
router.post(
  '/configs/:provider',
  providerParamValidator,
  toggleConfigValidator,
  validateRequest,
  adminIntegrationController.toggleConfig
)
router.get('/webhook-events', listWebhookEventsValidator, validateRequest, adminIntegrationController.getWebhookEvents)
router.get('/automation-logs', listAutomationLogsValidator, validateRequest, adminIntegrationController.getAutomationLogs)

export default router
