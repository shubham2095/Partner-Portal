import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { dateRangeValidator } from '../validators/analytics.validators.js'
import * as freelancerAnalyticsController from '../controllers/freelancerAnalyticsController.js'

const router = Router()

router.use(authenticate, authorizeRole('FREELANCER'))

router.get('/summary', freelancerAnalyticsController.getMySummary)
router.get('/pipeline', freelancerAnalyticsController.getMyPipeline)
router.get('/performance-trend', dateRangeValidator, validateRequest, freelancerAnalyticsController.getMyPerformanceTrend)

export default router
