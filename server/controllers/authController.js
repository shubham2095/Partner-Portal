import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as authService from '../services/authService.js'

export const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, mobile } = req.body
  const { user, token } = await authService.registerFreelancer({ email, password, fullName, mobile })
  sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful. Please check your email to verify your account.',
    data: { user, token },
  })
})

export const freelancerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const { user, token } = await authService.loginUser({ email, password, allowedRoles: ['FREELANCER'] })
  sendSuccess(res, { message: 'Login successful', data: { user, token } })
})

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const { user, token } = await authService.loginUser({
    email,
    password,
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
  })
  sendSuccess(res, { message: 'Login successful', data: { user, token } })
})

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id)
  sendSuccess(res, { message: 'Current user retrieved', data: { user } })
})

export const logout = asyncHandler(async (req, res) => {
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
