import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  dateRangeValidator,
  paginationValidator,
  reportTypeParamValidator,
  reportFilterValidator,
  webinarIdQueryValidator,
} from '../validators/analytics.validators.js'
import * as adminAnalyticsController from '../controllers/adminAnalyticsController.js'

const router = Router()

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

router.get('/overview', adminAnalyticsController.getOverview)
router.get('/leads-over-time', dateRangeValidator, validateRequest, adminAnalyticsController.getLeadsOverTime)
router.get('/conversion-funnel', adminAnalyticsController.getConversionFunnel)
router.get('/revenue-trend', dateRangeValidator, validateRequest, adminAnalyticsController.getRevenueTrend)
router.get(
  '/freelancer-performance',
  paginationValidator,
  validateRequest,
  adminAnalyticsController.getFreelancerPerformance
)
router.get('/webinar-funnel', webinarIdQueryValidator, validateRequest, adminAnalyticsController.getWebinarFunnel)
router.get('/source-performance', dateRangeValidator, validateRequest, adminAnalyticsController.getSourcePerformance)
router.get('/service-performance', dateRangeValidator, validateRequest, adminAnalyticsController.getServicePerformance)
router.get(
  '/reports/:type',
  reportTypeParamValidator,
  dateRangeValidator,
  paginationValidator,
  reportFilterValidator,
  validateRequest,
  adminAnalyticsController.getReport
)
router.get(
  '/reports/:type/export',
  reportTypeParamValidator,
  dateRangeValidator,
  reportFilterValidator,
  validateRequest,
  adminAnalyticsController.exportReport
)

export default router
