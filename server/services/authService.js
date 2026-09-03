import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { signAccessToken, generateRandomToken } from './tokenService.js'
import { generatePartnerId } from './partnerIdService.js'
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js'
import { logAudit } from './auditService.js'
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateLastLogin,
  setEmailVerified,
  updatePasswordHash,
} from '../models/userModel.js'
import { createFreelancerProfile, setPartnerId } from '../models/freelancerProfileModel.js'
import {
  createEmailVerificationToken,
  findValidEmailVerificationToken,
  markEmailVerificationTokenUsed,
  invalidateEmailVerificationTokensForUser,
} from '../models/emailVerificationTokenModel.js'
import {
  createPasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
  invalidatePasswordResetTokensForUser,
} from '../models/passwordResetTokenModel.js'

const EMAIL_VERIFICATION_EXPIRY_HOURS = 48
const PASSWORD_RESET_EXPIRY_HOURS = 1

function addHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

function toPublicUser(user) {
  const { password_hash, ...publicUser } = user
  return publicUser
}

export async function registerFreelancer({ email, password, fullName, mobile }) {
  const existing = await findUserByEmail(email)
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists')
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds)

  const connection = await pool.getConnection()
  let userId
  let profileId

  try {
    await connection.beginTransaction()

    userId = await createUser({ email, passwordHash, role: 'FREELANCER' }, connection)
    profileId = await createFreelancerProfile({ userId, fullName, mobile }, connection)
    const partnerId = generatePartnerId(profileId)
    await setPartnerId(profileId, partnerId, connection)

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  const verificationToken = generateRandomToken()
  await createEmailVerificationToken({
    userId,
    token: verificationToken,
    expiresAt: addHours(EMAIL_VERIFICATION_EXPIRY_HOURS),
  })
  // A transient mail failure must not roll back a completed signup — the user
  // can request a fresh link from the "check your inbox" screen.
  try {
    await sendVerificationEmail(email, verificationToken)
  } catch (error) {
    console.error('[auth] verification email failed to send', error)
  }

  const user = await findUserById(userId)
  // No access token here: the account is created but unverified. The user must
  // click the emailed link before they can log in.
  return { user: toPublicUser(user) }
}

export async function resendVerificationEmail(email) {
  const user = await findUserByEmail(email)
  // Respond identically whether or not the account exists / is already verified,
  // so this endpoint can't be used to enumerate registered emails.
  if (!user || user.role !== 'FREELANCER' || user.email_verified_at) {
    return
  }

  await invalidateEmailVerificationTokensForUser(user.id)
  const verificationToken = generateRandomToken()
  await createEmailVerificationToken({
    userId: user.id,
    token: verificationToken,
    expiresAt: addHours(EMAIL_VERIFICATION_EXPIRY_HOURS),
  })
  try {
    await sendVerificationEmail(email, verificationToken)
  } catch (error) {
    console.error('[auth] resend verification email failed', error)
  }
}

export async function loginUser({ email, password, allowedRoles, req }) {
  const user = await findUserByEmail(email)
  if (!user) {
    throw new ApiError(401, 'Invalid email or password')
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password')
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new ApiError(403, 'This login is not available for your account type')
  }

  if (!user.is_active) {
    throw new ApiError(403, 'Your account has been suspended. Please contact support.')
  }

  // Partners must confirm they own the email address before they can sign in.
  // Admins are provisioned internally and are exempt.
  if (user.role === 'FREELANCER' && !user.email_verified_at) {
    throw new ApiError(403, 'Please verify your email address — check your inbox for the link.', {
      code: 'EMAIL_NOT_VERIFIED',
    })
  }

  await updateLastLogin(user.id)
  await logAudit({ actorId: user.id, action: 'LOGIN', entity: 'USER', entityId: user.id, newValue: { role: user.role }, req })

  const token = signAccessToken(user)
  return { user: toPublicUser(user), token }
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }
  return toPublicUser(user)
}

export async function verifyEmail(token) {
  const record = await findValidEmailVerificationToken(token)
  if (!record) {
    throw new ApiError(400, 'Invalid or expired verification token')
  }
  await markEmailVerificationTokenUsed(record.id)
  await setEmailVerified(record.user_id)
}

export async function requestPasswordReset(email) {
  const user = await findUserByEmail(email)
  if (!user) {
    return
  }

  await invalidatePasswordResetTokensForUser(user.id)
  const token = generateRandomToken()
  await createPasswordResetToken({
    userId: user.id,
    token,
    expiresAt: addHours(PASSWORD_RESET_EXPIRY_HOURS),
  })
  await sendPasswordResetEmail(email, token)
}

export async function resetPassword(token, newPassword) {
  const record = await findValidPasswordResetToken(token)
  if (!record) {
    throw new ApiError(400, 'Invalid or expired reset token')
  }

  const passwordHash = await bcrypt.hash(newPassword, env.bcryptSaltRounds)
  await updatePasswordHash(record.user_id, passwordHash)
  await markPasswordResetTokenUsed(record.id)
  await invalidatePasswordResetTokensForUser(record.user_id)
}
