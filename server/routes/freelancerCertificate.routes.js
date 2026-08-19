import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { certificateIdParamValidator } from '../validators/certificate.validators.js'
import * as freelancerCertificateController from '../controllers/freelancerCertificateController.js'

const router = Router()

router.use(authenticate, authorizeRole('FREELANCER'))

router.get('/', freelancerCertificateController.listMyCertificates)
router.get(
  '/:id',
  certificateIdParamValidator,
  validateRequest,
  freelancerCertificateController.getMyCertificateDetail
)
router.get(
  '/:id/download',
  certificateIdParamValidator,
  validateRequest,
  freelancerCertificateController.downloadMyCertificate
)

export default router
