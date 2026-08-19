import { Router } from 'express'
import { validateRequest } from '../middleware/validateRequest.js'
import { certificateNumberParamValidator } from '../validators/certificate.validators.js'
import * as verificationController from '../controllers/verificationController.js'

const router = Router()

router.get(
  '/certificate/:certificateNumber',
  certificateNumberParamValidator,
  validateRequest,
  verificationController.verifyCertificate
)

export default router
