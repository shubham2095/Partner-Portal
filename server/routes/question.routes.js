import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  listQuestionsValidator,
  questionIdParamValidator,
  createQuestionValidator,
  updateQuestionValidator,
  setQuestionStatusValidator,
} from '../validators/question.validators.js'
import * as adminQuestionController from '../controllers/adminQuestionController.js'

const router = Router()

router.use(authenticate, authorizeRole('ADMIN', 'SUPER_ADMIN'))

router.get('/', listQuestionsValidator, validateRequest, adminQuestionController.listQuestions)
router.post('/', createQuestionValidator, validateRequest, adminQuestionController.createQuestion)
router.get('/:id', questionIdParamValidator, validateRequest, adminQuestionController.getQuestionDetail)
router.patch(
  '/:id',
  questionIdParamValidator,
  updateQuestionValidator,
  validateRequest,
  adminQuestionController.updateQuestion
)
router.post(
  '/:id/status',
  questionIdParamValidator,
  setQuestionStatusValidator,
  validateRequest,
  adminQuestionController.setQuestionStatus
)

export default router
