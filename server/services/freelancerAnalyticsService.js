import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import { resolveDateRange } from '../utils/dateRange.js'
import * as analyticsModel from '../models/analyticsModel.js'

async function requireProfile(userId) {
  const profile = await findProfileByUserId(userId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }
  return profile
}

export async function getMySummary(userId) {
  const profile = await requireProfile(userId)
  const summary = await analyticsModel.getFreelancerSummary(profile.id)
  return { ...summary, partnerLevel: profile.partner_level, status: profile.status }
}

export async function getMyPipeline(userId) {
  const profile = await requireProfile(userId)
  return analyticsModel.getFreelancerPipeline(profile.id)
}

export async function getMyPerformanceTrend(userId, query) {
  const profile = await requireProfile(userId)
  const { from, to } = resolveDateRange(query, 30)
  return { from, to, series: await analyticsModel.getFreelancerPerformanceTrend(profile.id, from, to) }
}
