import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import { findWebinarById, listVisibleWebinars } from '../models/webinarModel.js'
import {
  createRegistration,
  findRegistration,
  listRegistrationsByFreelancer,
} from '../models/webinarRegistrationModel.js'
import { notify } from './notificationService.js'

async function requireProfile(userId) {
  const profile = await findProfileByUserId(userId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }
  return profile
}

export async function listAvailableWebinars({ status, search, page, limit }) {
  const { rows, total } = await listVisibleWebinars({ status, search, page, limit })
  return { rows, total, page, limit }
}

export async function getWebinarDetail(webinarId, userId) {
  const webinar = await findWebinarById(webinarId)
  if (!webinar || !['PUBLISHED', 'LIVE', 'COMPLETED'].includes(webinar.status)) {
    throw new ApiError(404, 'Webinar not found')
  }
  const profile = await requireProfile(userId)
  const registration = await findRegistration(webinarId, profile.id)
  return { webinar, registration: registration ?? null }
}

export async function registerForWebinar(webinarId, userId, { source, campaign }) {
  const profile = await requireProfile(userId)
  const webinar = await findWebinarById(webinarId)
  if (!webinar || !['PUBLISHED', 'LIVE'].includes(webinar.status)) {
    throw new ApiError(404, 'Webinar is not available for registration')
  }

  const existing = await findRegistration(webinarId, profile.id)
  if (existing) {
    throw new ApiError(409, 'You are already registered for this webinar')
  }

  await createRegistration({ webinarId, freelancerId: profile.id, source, campaign })

  notify({
    recipientUserId: userId,
    type: 'WEBINAR_REGISTRATION_CONFIRMED',
    title: 'Webinar registration confirmed',
    message: `You're registered for ${webinar.title}.`,
    relatedEntityType: 'webinar',
    relatedEntityId: webinarId,
    emailSubject: `Registration confirmed: ${webinar.title}`,
    emailHtml: `<p>You're registered for <strong>${webinar.title}</strong>.</p>`,
  }).catch((error) => console.error('[freelancerWebinarService] Failed to notify registration confirmation:', error.message))

  return findRegistration(webinarId, profile.id)
}

export async function listMyRegistrations(userId) {
  const profile = await requireProfile(userId)
  return listRegistrationsByFreelancer(profile.id)
}
