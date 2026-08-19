import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as freelancerWebinarService from '../services/freelancerWebinarService.js'

export const listAvailableWebinars = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query
  const result = await freelancerWebinarService.listAvailableWebinars({
    status,
    search,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Webinars retrieved',
    data: { webinars: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getWebinarDetail = asyncHandler(async (req, res) => {
  const detail = await freelancerWebinarService.getWebinarDetail(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Webinar detail retrieved', data: detail })
})

export const registerForWebinar = asyncHandler(async (req, res) => {
  const registration = await freelancerWebinarService.registerForWebinar(Number(req.params.id), req.user.id, req.body)
  sendSuccess(res, { statusCode: 201, message: 'Registered for webinar', data: { registration } })
})

export const listMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await freelancerWebinarService.listMyRegistrations(req.user.id)
  sendSuccess(res, { message: 'Your registrations retrieved', data: { registrations } })
})
