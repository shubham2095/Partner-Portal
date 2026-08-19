import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { createUploadHandler } from '../middleware/uploadHandler.js'
import {
  updateProfessionalDetailsValidator,
  uploadDocumentValidator,
} from '../validators/freelancer.validators.js'
import * as freelancerController from '../controllers/freelancerController.js'

const router = Router()
const uploadPhoto = createUploadHandler('images')
const uploadDocument = createUploadHandler('documents')

router.use(authenticate, authorizeRole('FREELANCER'))

router.get('/profile', freelancerController.getMyProfile)
router.patch(
  '/profile',
  updateProfessionalDetailsValidator,
  validateRequest,
  freelancerController.updateMyProfile
)
router.post('/profile/photo', uploadPhoto.single('photo'), freelancerController.uploadMyProfilePhoto)
router.get('/documents', freelancerController.listMyDocuments)
router.post(
  '/documents',
  uploadDocument.single('document'),
  uploadDocumentValidator,
  validateRequest,
  freelancerController.uploadMyDocument
)

export default router
