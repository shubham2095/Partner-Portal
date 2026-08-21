import { ApiError } from '../utils/ApiError.js'
import { findProfileById } from '../models/freelancerProfileModel.js'
import { updatePartnerLevel, createLevelHistory, listLevelHistory } from '../models/partnerLevelModel.js'
import { logAudit } from './auditService.js'

export const PARTNER_LEVELS = ['STARTER', 'CERTIFIED_PARTNER', 'PREMIUM_PARTNER', 'ELITE_PARTNER']

export async function changePartnerLevel(freelancerId, newLevel, reason, adminId, req) {
  const profile = await findProfileById(freelancerId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer not found')
  }
  if (!PARTNER_LEVELS.includes(newLevel)) {
    throw new ApiError(422, 'Invalid partner level')
  }

  const previousLevel = profile.partner_level
  await updatePartnerLevel(freelancerId, newLevel)
  await createLevelHistory({ freelancerId, previousLevel, newLevel, changedBy: adminId, reason })

  await logAudit({
    actorId: adminId,
    action: 'PARTNER_LEVEL_CHANGED',
    entity: 'freelancer_profile',
    entityId: freelancerId,
    oldValue: { partnerLevel: previousLevel },
    newValue: { partnerLevel: newLevel, reason: reason ?? null },
    req,
  })

  return findProfileById(freelancerId)
}

export async function getLevelHistory(freelancerId) {
  const profile = await findProfileById(freelancerId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer not found')
  }
  return listLevelHistory(freelancerId)
}
