import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { createUploadHandler } from '../middleware/uploadHandler.js'
import {
  commissionIdParamValidator,
  ruleIdParamValidator,
  freelancerIdParamValidator,
  listRulesValidator,
  createRuleValidator,
  changeRuleStatusValidator,
  listCommissionsValidator,
  createCommissionValidator,
  changeCommissionStatusValidator,
  listPaymentsValidator,
  createPaymentValidator,
  changePartnerLevelValidator,
} from '../validators/commission.validators.js'
import * as adminCommissionController from '../controllers/adminCommissionController.js'

const router = Router()
const uploadProof = createUploadHandler('payments')

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

// Commission rules
router.get('/rules', listRulesValidator, validateRequest, adminCommissionController.listRules)
router.post('/rules', createRuleValidator, validateRequest, adminCommissionController.createRule)
router.post(
  '/rules/:id/status',
  ruleIdParamValidator,
  changeRuleStatusValidator,
  validateRequest,
  adminCommissionController.changeRuleStatus
)

// Payments (payout overview)
router.get('/payments', listPaymentsValidator, validateRequest, adminCommissionController.listPayments)

// Freelancer payment details / partner level (admin view/manage)
router.get(
  '/freelancers/:freelancerId/payment-details',
  freelancerIdParamValidator,
  validateRequest,
  adminCommissionController.getFreelancerPaymentDetails
)
router.post(
  '/freelancers/:freelancerId/level',
  freelancerIdParamValidator,
  changePartnerLevelValidator,
  validateRequest,
  adminCommissionController.changePartnerLevel
)
router.get(
  '/freelancers/:freelancerId/level-history',
  freelancerIdParamValidator,
  validateRequest,
  adminCommissionController.getLevelHistory
)

// Commissions
router.get('/', listCommissionsValidator, validateRequest, adminCommissionController.listCommissions)
router.post('/', createCommissionValidator, validateRequest, adminCommissionController.createCommission)
router.get('/:id', commissionIdParamValidator, validateRequest, adminCommissionController.getCommissionDetail)
router.post(
  '/:id/status',
  commissionIdParamValidator,
  changeCommissionStatusValidator,
  validateRequest,
  adminCommissionController.changeCommissionStatus
)
router.post(
  '/:id/payments',
  commissionIdParamValidator,
  uploadProof.single('proof'),
  createPaymentValidator,
  validateRequest,
  adminCommissionController.createPayment
)
router.get(
  '/:id/payments/proof',
  commissionIdParamValidator,
  validateRequest,
  adminCommissionController.downloadPaymentProof
)

export default router
