import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { testIdParamValidator } from '../validators/test.validators.js'
import * as freelancerTestController from '../controllers/freelancerTestController.js'

const router = Router()

router.use(authenticate, authorizeRole('FREELANCER'))

router.get('/', freelancerTestController.listAvailableTests)
router.get('/attempts', freelancerTestController.listMyAttempts)
router.get('/:id', testIdParamValidator, validateRequest, freelancerTestController.getTestInstructions)
router.post('/:id/attempts', testIdParamValidator, validateRequest, freelancerTestController.startAttempt)

export default router
