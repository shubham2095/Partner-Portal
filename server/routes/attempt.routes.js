import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { attemptIdParamValidator, saveAnswerValidator } from '../validators/attempt.validators.js'
import * as testAttemptController from '../controllers/testAttemptController.js'

const router = Router()

router.use(authenticate, authorizeRole('FREELANCER'))

router.get('/:id', attemptIdParamValidator, validateRequest, testAttemptController.getAttemptSession)
router.post(
  '/:id/answers',
  attemptIdParamValidator,
  saveAnswerValidator,
  validateRequest,
  testAttemptController.saveAnswer
)
router.post('/:id/submit', attemptIdParamValidator, validateRequest, testAttemptController.submitAttempt)
router.get('/:id/result', attemptIdParamValidator, validateRequest, testAttemptController.getAttemptResult)

export default router
