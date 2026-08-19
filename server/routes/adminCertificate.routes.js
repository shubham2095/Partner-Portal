import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  listCertificatesValidator,
  certificateIdParamValidator,
  revokeCertificateValidator,
} from '../validators/certificate.validators.js'
import * as adminCertificateController from '../controllers/adminCertificateController.js'

const router = Router()

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

router.get('/', listCertificatesValidator, validateRequest, adminCertificateController.listCertificates)
router.get(
  '/:id',
  certificateIdParamValidator,
  validateRequest,
  adminCertificateController.getCertificateDetail
)
router.get(
  '/:id/download',
  certificateIdParamValidator,
  validateRequest,
  adminCertificateController.downloadCertificate
)
router.post(
  '/:id/regenerate',
  certificateIdParamValidator,
  validateRequest,
  adminCertificateController.regenerateCertificatePdf
)
router.post(
  '/:id/revoke',
  certificateIdParamValidator,
  revokeCertificateValidator,
  validateRequest,
  adminCertificateController.revokeCertificate
)

export default router
