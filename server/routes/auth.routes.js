import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
} from '../validators/auth.validators.js'
import * as authController from '../controllers/authController.js'

const router = Router()

router.post('/register', registerValidator, validateRequest, authController.register)
router.post('/login/freelancer', loginValidator, validateRequest, authController.freelancerLogin)
router.post('/login/admin', loginValidator, validateRequest, authController.adminLogin)
router.post('/verify-email', verifyEmailValidator, validateRequest, authController.verifyEmail)
router.post('/forgot-password', forgotPasswordValidator, validateRequest, authController.forgotPassword)
router.post('/reset-password', resetPasswordValidator, validateRequest, authController.resetPassword)
router.get('/me', authenticate, authController.me)
router.post('/logout', authenticate, authController.logout)

export default router
