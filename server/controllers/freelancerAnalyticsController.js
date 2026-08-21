import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as freelancerAnalyticsService from '../services/freelancerAnalyticsService.js'

export const getMySummary = asyncHandler(async (req, res) => {
  const summary = await freelancerAnalyticsService.getMySummary(req.user.id)
  sendSuccess(res, { message: 'Summary retrieved', data: summary })
})

export const getMyPipeline = asyncHandler(async (req, res) => {
  const pipeline = await freelancerAnalyticsService.getMyPipeline(req.user.id)
  sendSuccess(res, { message: 'Pipeline retrieved', data: { pipeline } })
})

export const getMyPerformanceTrend = asyncHandler(async (req, res) => {
  const result = await freelancerAnalyticsService.getMyPerformanceTrend(req.user.id, req.query)
  sendSuccess(res, { message: 'Performance trend retrieved', data: result })
})
