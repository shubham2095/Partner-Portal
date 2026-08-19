import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  listTestsValidator,
  testIdParamValidator,
  createTestValidator,
  updateTestValidator,
  changeTestStatusValidator,
  addTestQuestionValidator,
  testQuestionIdParamValidator,
  reorderTestQuestionsValidator,
  listTestAttemptsValidator,
} from '../validators/test.validators.js'
import * as adminTestController from '../controllers/adminTestController.js'

const router = Router()

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

router.get('/', listTestsValidator, validateRequest, adminTestController.listTests)
router.post('/', createTestValidator, validateRequest, adminTestController.createTest)
router.get('/:id', testIdParamValidator, validateRequest, adminTestController.getTestDetail)
router.patch(
  '/:id',
  testIdParamValidator,
  updateTestValidator,
  validateRequest,
  adminTestController.updateTest
)
router.post(
  '/:id/status',
  testIdParamValidator,
  changeTestStatusValidator,
  validateRequest,
  adminTestController.changeTestStatus
)
router.post(
  '/:id/questions',
  testIdParamValidator,
  addTestQuestionValidator,
  validateRequest,
  adminTestController.addQuestion
)
router.patch(
  '/:id/questions/reorder',
  testIdParamValidator,
  reorderTestQuestionsValidator,
  validateRequest,
  adminTestController.reorderQuestions
)
router.delete(
  '/:id/questions/:questionId',
  testIdParamValidator,
  testQuestionIdParamValidator,
  validateRequest,
  adminTestController.removeQuestion
)
router.get(
  '/:id/attempts',
  testIdParamValidator,
  listTestAttemptsValidator,
  validateRequest,
  adminTestController.listTestAttempts
)

export default router
