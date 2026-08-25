import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  commissionIdParamValidator,
  listMyCommissionsValidator,
  updatePaymentDetailsValidator,
} from '../validators/commission.validators.js'
import * as freelancerCommissionController from '../controllers/freelancerCommissionController.js'

const router = Router()

router.use(authenticate, authorizeRole('FREELANCER'))

router.get('/summary', freelancerCommissionController.getMyEarningsSummary)
router.get('/payments', freelancerCommissionController.listMyPayments)
router.get('/payment-details', freelancerCommissionController.getMyPaymentDetails)
router.put(
  '/payment-details',
  updatePaymentDetailsValidator,
  validateRequest,
  freelancerCommissionController.updateMyPaymentDetails
)
router.get('/level-history', freelancerCommissionController.getMyLevelHistory)
router.get('/', listMyCommissionsValidator, validateRequest, freelancerCommissionController.listMyCommissions)
router.get('/:id', commissionIdParamValidator, validateRequest, freelancerCommissionController.getMyCommissionDetail)
router.get(
  '/:id/contract',
  commissionIdParamValidator,
  validateRequest,
  freelancerCommissionController.downloadMyContract
)

export default router
