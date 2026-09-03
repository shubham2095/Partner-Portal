import { OAuth2Client } from 'google-auth-library'
import { pool } from '../config/database.js'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { signAccessToken } from './tokenService.js'
import { generatePartnerId } from './partnerIdService.js'
import { logAudit } from './auditService.js'
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByGoogleSub,
  linkGoogleSub,
  updateLastLogin,
} from '../models/userModel.js'
import { createFreelancerProfile, setPartnerId } from '../models/freelancerProfileModel.js'

const client = env.googleAuth.clientId ? new OAuth2Client(env.googleAuth.clientId) : null

function toPublicUser(user) {
  const { password_hash, ...publicUser } = user
  return publicUser
}

async function verifyGoogleIdToken(idToken) {
  if (!client) {
    throw new ApiError(503, 'Google sign-in is not configured on this server')
  }
  let ticket
  try {
    ticket = await client.verifyIdToken({ idToken, audience: env.googleAuth.clientId })
  } catch {
    throw new ApiError(401, 'Invalid Google credential')
  }
  const payload = ticket.getPayload()
  if (!payload?.sub || !payload.email) {
    throw new ApiError(401, 'Google account did not return an email')
  }
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: payload.name || payload.email.split('@')[0],
  }
}

async function createGoogleFreelancer({ email, sub, name, emailVerified }) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const userId = await createUser(
      { email, role: 'FREELANCER', authProvider: 'GOOGLE', googleSub: sub },
      connection
    )
    if (emailVerified) {
      await connection.query('UPDATE users SET email_verified_at = NOW() WHERE id = ?', [userId])
    }

    const profileId = await createFreelancerProfile({ userId, fullName: name, mobile: '' }, connection)
    await setPartnerId(profileId, generatePartnerId(profileId), connection)

    await connection.commit()
    return userId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function loginWithGoogle(idToken, req) {
  const { sub, email, name, emailVerified } = await verifyGoogleIdToken(idToken)

  // 1. Returning Google user — matched by Google's stable subject id.
  let user = await findUserByGoogleSub(sub)

  // 2. Existing account with the same (verified) email — link Google to it.
  if (!user) {
    const byEmail = await findUserByEmail(email)
    if (byEmail) {
      if (!emailVerified) {
        throw new ApiError(409, 'An account with this email already exists. Please log in with your password.')
      }
      await linkGoogleSub(byEmail.id, sub)
      user = await findUserById(byEmail.id)
    }
  }

  // 3. Brand-new partner — create the user + freelancer profile + Partner ID.
  if (!user) {
    const userId = await createGoogleFreelancer({ email, sub, name, emailVerified })
    user = await findUserById(userId)
  }

  if (!user.is_active) {
    throw new ApiError(403, 'Your account has been suspended. Please contact support.')
  }

  await updateLastLogin(user.id)
  await logAudit({
    actorId: user.id,
    action: 'LOGIN',
    entity: 'USER',
    entityId: user.id,
    newValue: { role: user.role, via: 'GOOGLE' },
    req,
  })

  return { user: toPublicUser(user), token: signAccessToken(user) }
}
