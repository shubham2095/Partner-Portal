import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { createUploadHandler } from '../middleware/uploadHandler.js'
import {
  listCategoriesValidator,
  categoryIdParamValidator,
  createCategoryValidator,
  updateCategoryValidator,
  listTrainingsValidator,
  trainingIdParamValidator,
  createTrainingValidator,
  updateTrainingValidator,
  changeTrainingStatusValidator,
  moduleIdParamValidator,
  createModuleValidator,
  updateModuleValidator,
  lessonIdParamValidator,
  createLessonValidator,
  updateLessonValidator,
  materialIdParamValidator,
  uploadMaterialValidator,
  videoIdParamValidator,
  createVideoValidator,
  updateVideoValidator,
} from '../validators/training.validators.js'
import * as adminTrainingController from '../controllers/adminTrainingController.js'

const router = Router()
const uploadMaterial = createUploadHandler('training')

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

// Categories
router.get('/categories', listCategoriesValidator, validateRequest, adminTrainingController.listCategories)
router.post('/categories', createCategoryValidator, validateRequest, adminTrainingController.createCategory)
router.patch(
  '/categories/:id',
  categoryIdParamValidator,
  updateCategoryValidator,
  validateRequest,
  adminTrainingController.updateCategory
)

// Trainings
router.get('/', listTrainingsValidator, validateRequest, adminTrainingController.listTrainings)
router.post('/', createTrainingValidator, validateRequest, adminTrainingController.createTraining)
router.get('/:id', trainingIdParamValidator, validateRequest, adminTrainingController.getTrainingDetail)
router.patch('/:id', trainingIdParamValidator, updateTrainingValidator, validateRequest, adminTrainingController.updateTraining)
router.post(
  '/:id/status',
  trainingIdParamValidator,
  changeTrainingStatusValidator,
  validateRequest,
  adminTrainingController.changeTrainingStatus
)

// Modules
router.post('/:id/modules', trainingIdParamValidator, createModuleValidator, validateRequest, adminTrainingController.addModule)
router.patch(
  '/modules/:moduleId',
  moduleIdParamValidator,
  updateModuleValidator,
  validateRequest,
  adminTrainingController.updateModule
)
router.delete('/modules/:moduleId', moduleIdParamValidator, validateRequest, adminTrainingController.removeModule)

// Lessons
router.post(
  '/modules/:moduleId/lessons',
  moduleIdParamValidator,
  createLessonValidator,
  validateRequest,
  adminTrainingController.addLesson
)
router.patch(
  '/lessons/:lessonId',
  lessonIdParamValidator,
  updateLessonValidator,
  validateRequest,
  adminTrainingController.updateLesson
)
router.delete('/lessons/:lessonId', lessonIdParamValidator, validateRequest, adminTrainingController.removeLesson)

// Materials
router.post(
  '/lessons/:lessonId/materials',
  lessonIdParamValidator,
  uploadMaterial.single('material'),
  uploadMaterialValidator,
  validateRequest,
  adminTrainingController.addMaterial
)
router.delete('/materials/:materialId', materialIdParamValidator, validateRequest, adminTrainingController.removeMaterial)
router.get('/materials/:materialId/download', materialIdParamValidator, validateRequest, adminTrainingController.downloadMaterial)

// Videos
router.post(
  '/lessons/:lessonId/videos',
  lessonIdParamValidator,
  createVideoValidator,
  validateRequest,
  adminTrainingController.addVideo
)
router.patch(
  '/videos/:videoId',
  videoIdParamValidator,
  updateVideoValidator,
  validateRequest,
  adminTrainingController.updateVideo
)
router.delete('/videos/:videoId', videoIdParamValidator, validateRequest, adminTrainingController.removeVideo)

export default router
