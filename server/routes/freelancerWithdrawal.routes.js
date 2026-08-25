import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  withdrawalIdParamValidator,
  createWithdrawalValidator,
  listMyWithdrawalsValidator,
} from '../validators/withdrawal.validators.js'
import * as freelancerWithdrawalController from '../controllers/freelancerWithdrawalController.js'

const router = Router()

router.use(authenticate, authorizeRole('FREELANCER'))

router.get('/available-balance', freelancerWithdrawalController.getMyAvailableBalance)
router.get('/summary', freelancerWithdrawalController.getMyWithdrawalSummary)
router.get('/', listMyWithdrawalsValidator, validateRequest, freelancerWithdrawalController.listMyWithdrawals)
router.post('/', createWithdrawalValidator, validateRequest, freelancerWithdrawalController.createWithdrawal)
router.get('/:id', withdrawalIdParamValidator, validateRequest, freelancerWithdrawalController.getMyWithdrawalDetail)

export default router
