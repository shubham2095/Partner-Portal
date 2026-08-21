import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as adminAnalyticsService from '../services/adminAnalyticsService.js'

export const getOverview = asyncHandler(async (req, res) => {
  const overview = await adminAnalyticsService.getOverview()
  sendSuccess(res, { message: 'Overview retrieved', data: overview })
})

export const getLeadsOverTime = asyncHandler(async (req, res) => {
  const result = await adminAnalyticsService.getLeadsOverTime(req.query)
  sendSuccess(res, { message: 'Leads over time retrieved', data: result })
})

export const getConversionFunnel = asyncHandler(async (req, res) => {
  const funnel = await adminAnalyticsService.getConversionFunnel()
  sendSuccess(res, { message: 'Conversion funnel retrieved', data: { funnel } })
})

export const getRevenueTrend = asyncHandler(async (req, res) => {
  const result = await adminAnalyticsService.getRevenueTrend(req.query)
  sendSuccess(res, { message: 'Revenue trend retrieved', data: result })
})

export const getFreelancerPerformance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const result = await adminAnalyticsService.getFreelancerPerformance({ page: Number(page), limit: Number(limit) })
  sendSuccess(res, {
    message: 'Freelancer performance retrieved',
    data: { freelancers: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getWebinarFunnel = asyncHandler(async (req, res) => {
  const webinarId = req.query.webinarId ? Number(req.query.webinarId) : undefined
  const funnel = await adminAnalyticsService.getWebinarFunnel(webinarId)
  sendSuccess(res, { message: 'Webinar funnel retrieved', data: { webinars: funnel } })
})

export const getSourcePerformance = asyncHandler(async (req, res) => {
  const result = await adminAnalyticsService.getSourcePerformance(req.query)
  sendSuccess(res, { message: 'Source performance retrieved', data: result })
})

export const getServicePerformance = asyncHandler(async (req, res) => {
  const result = await adminAnalyticsService.getServicePerformance(req.query)
  sendSuccess(res, { message: 'Service performance retrieved', data: result })
})

export const getReport = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query
  const result = await adminAnalyticsService.getReport(req.params.type, {
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Report retrieved',
    data: { rows: result.rows, from: result.from, to: result.to },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const exportReport = asyncHandler(async (req, res) => {
  const csv = await adminAnalyticsService.exportReportCsv(req.params.type, {
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  })
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.type}-report.csv"`)
  res.status(200).send(csv)
})
