import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import {
  registerValidator,
  loginValidator,
  googleLoginValidator,
  forgotPasswordValidator,
  resendVerificationValidator,
  resetPasswordValidator,
  verifyEmailValidator,
} from '../validators/auth.validators.js'
import * as authController from '../controllers/authController.js'

const router = Router()

router.post('/register', authLimiter, registerValidator, validateRequest, authController.register)
router.post('/login/freelancer', authLimiter, loginValidator, validateRequest, authController.freelancerLogin)
router.post('/login/admin', authLimiter, loginValidator, validateRequest, authController.adminLogin)
router.post('/google', authLimiter, googleLoginValidator, validateRequest, authController.googleLogin)
router.post('/verify-email', verifyEmailValidator, validateRequest, authController.verifyEmail)
router.post(
  '/resend-verification',
  authLimiter,
  resendVerificationValidator,
  validateRequest,
  authController.resendVerification
)
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validateRequest, authController.forgotPassword)
router.post('/reset-password', authLimiter, resetPasswordValidator, validateRequest, authController.resetPassword)
router.get('/me', authenticate, authController.me)
router.post('/logout', authenticate, authController.logout)

export default router
