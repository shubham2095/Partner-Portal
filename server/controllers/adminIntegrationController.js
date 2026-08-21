import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as adminIntegrationService from '../services/adminIntegrationService.js'

export const getConfigs = asyncHandler(async (req, res) => {
  const configs = await adminIntegrationService.getConfigs()
  sendSuccess(res, { message: 'Integration configs retrieved', data: { configs } })
})

export const toggleConfig = asyncHandler(async (req, res) => {
  const config = await adminIntegrationService.toggleConfig(
    req.params.provider,
    req.body.isEnabled,
    req.user.id,
    req
  )
  sendSuccess(res, { message: 'Integration config updated', data: { config } })
})

export const getWebhookEvents = asyncHandler(async (req, res) => {
  const { provider, status, page = 1, limit = 20 } = req.query
  const result = await adminIntegrationService.getWebhookEvents({
    provider,
    status,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Webhook events retrieved',
    data: { events: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getAutomationLogs = asyncHandler(async (req, res) => {
  const { jobName, page = 1, limit = 20 } = req.query
  const result = await adminIntegrationService.getAutomationLogs({
    jobName,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Automation logs retrieved',
    data: { logs: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})
