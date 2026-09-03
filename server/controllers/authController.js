import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as authService from '../services/authService.js'
import { loginWithGoogle } from '../services/googleAuthService.js'
import { logAudit } from '../services/auditService.js'

export const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, mobile } = req.body
  const { user } = await authService.registerFreelancer({ email, password, fullName, mobile })
  sendSuccess(res, {
    statusCode: 201,
    message: 'Account created. Check your email for a verification link to activate it.',
    data: { email: user.email },
  })
})

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerificationEmail(req.body.email)
  sendSuccess(res, {
    message: 'If that account exists and is not yet verified, a new link has been sent.',
  })
})

export const freelancerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const { user, token } = await authService.loginUser({ email, password, allowedRoles: ['FREELANCER'], req })
  sendSuccess(res, { message: 'Login successful', data: { user, token } })
})

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const { user, token } = await authService.loginUser({
    email,
    password,
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    req,
  })
  sendSuccess(res, { message: 'Login successful', data: { user, token } })
})

export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body
  const { user, token } = await loginWithGoogle(idToken, req)
  sendSuccess(res, { message: 'Login successful', data: { user, token } })
})

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id)
  sendSuccess(res, { message: 'Current user retrieved', data: { user } })
})

export const logout = asyncHandler(async (req, res) => {
  await logAudit({ actorId: req.user.id, action: 'LOGOUT', entity: 'USER', entityId: req.user.id, req })
  sendSuccess(res, { message: 'Logged out successfully' })
})

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body
  await authService.verifyEmail(token)
  sendSuccess(res, { message: 'Email verified successfully' })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  await authService.requestPasswordReset(email)
  sendSuccess(res, { message: 'If an account exists for this email, a reset link has been sent.' })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body
  await authService.resetPassword(token, newPassword)
  sendSuccess(res, { message: 'Password reset successfully. You can now log in.' })
})
