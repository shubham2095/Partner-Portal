import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  listTrainingsValidator,
  trainingIdParamValidator,
  lessonIdParamValidator,
  materialIdParamValidator,
  videoIdParamValidator,
  saveVideoProgressValidator,
} from '../validators/training.validators.js'
import * as freelancerTrainingController from '../controllers/freelancerTrainingController.js'

const router = Router()

router.use(authenticate, authorizeRole('FREELANCER'))

router.get('/dashboard', freelancerTrainingController.getDashboardSummary)
router.get('/enrollments', freelancerTrainingController.listMyEnrollments)
router.get('/', listTrainingsValidator, validateRequest, freelancerTrainingController.listTrainings)
router.get('/:id', trainingIdParamValidator, validateRequest, freelancerTrainingController.getTrainingDetail)
router.post(
  '/lessons/:lessonId/complete',
  lessonIdParamValidator,
  validateRequest,
  freelancerTrainingController.markLessonComplete
)
router.post(
  '/videos/:videoId/progress',
  videoIdParamValidator,
  saveVideoProgressValidator,
  validateRequest,
  freelancerTrainingController.saveVideoProgress
)
router.get(
  '/materials/:materialId/download',
  materialIdParamValidator,
  validateRequest,
  freelancerTrainingController.downloadMaterial
)

export default router
