import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { createUploadHandler } from '../middleware/uploadHandler.js'
import {
  withdrawalIdParamValidator,
  listWithdrawalsValidator,
  rejectWithdrawalValidator,
  markWithdrawalPaidValidator,
} from '../validators/withdrawal.validators.js'
import * as adminWithdrawalController from '../controllers/adminWithdrawalController.js'

const router = Router()
const uploadProof = createUploadHandler('withdrawals')

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

router.get('/', listWithdrawalsValidator, validateRequest, adminWithdrawalController.listWithdrawals)
router.get('/:id', withdrawalIdParamValidator, validateRequest, adminWithdrawalController.getWithdrawalDetail)
router.post('/:id/approve', withdrawalIdParamValidator, validateRequest, adminWithdrawalController.approveWithdrawal)
router.post(
  '/:id/reject',
  withdrawalIdParamValidator,
  rejectWithdrawalValidator,
  validateRequest,
  adminWithdrawalController.rejectWithdrawal
)
router.post(
  '/:id/mark-paid',
  withdrawalIdParamValidator,
  uploadProof.single('proof'),
  markWithdrawalPaidValidator,
  validateRequest,
  adminWithdrawalController.markWithdrawalPaid
)

export default router
