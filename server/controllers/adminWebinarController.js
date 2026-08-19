import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as adminWebinarService from '../services/adminWebinarService.js'

export const listWebinars = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query
  const result = await adminWebinarService.listWebinarsAdmin({ status, search, page: Number(page), limit: Number(limit) })
  sendSuccess(res, {
    message: 'Webinars retrieved',
    data: { webinars: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const createWebinar = asyncHandler(async (req, res) => {
  const webinar = await adminWebinarService.createWebinar(req.body, req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Webinar created', data: { webinar } })
})

export const getWebinarDetail = asyncHandler(async (req, res) => {
  const detail = await adminWebinarService.getWebinarDetail(Number(req.params.id))
  sendSuccess(res, { message: 'Webinar detail retrieved', data: detail })
})

export const updateWebinar = asyncHandler(async (req, res) => {
  const webinar = await adminWebinarService.updateWebinar(Number(req.params.id), req.body, req.user.id, req)
  sendSuccess(res, { message: 'Webinar updated', data: { webinar } })
})

export const changeWebinarStatus = asyncHandler(async (req, res) => {
  const webinar = await adminWebinarService.changeWebinarStatus(Number(req.params.id), req.body.status, req.user.id, req)
  sendSuccess(res, { message: 'Webinar status updated', data: { webinar } })
})

export const listWebinarRegistrations = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query
  const result = await adminWebinarService.listWebinarRegistrations(Number(req.params.id), {
    status,
    search,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Registrations retrieved',
    data: { registrations: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const markAttendance = asyncHandler(async (req, res) => {
  const attendance = await adminWebinarService.markAttendance(
    Number(req.params.registrationId),
    req.body,
    req.user.id,
    req
  )
  sendSuccess(res, { message: 'Attendance updated', data: { attendance } })
})
