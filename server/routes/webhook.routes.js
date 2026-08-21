import { Router } from 'express'
import { webhookLimiter } from '../middleware/rateLimiter.js'
import * as webhookController from '../controllers/webhookController.js'

// Public — external providers call these directly, authenticated by their
// own signature/shared-key mechanism rather than our JWT auth.
const router = Router()

router.use(webhookLimiter)

router.get('/meta-lead-ads', webhookController.verifyMetaSubscription)
router.post('/meta-lead-ads', webhookController.handleMetaWebhook)
router.post('/google-lead-forms', webhookController.handleGoogleWebhook)

export default router
