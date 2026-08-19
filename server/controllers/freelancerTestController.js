import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as freelancerTestService from '../services/freelancerTestService.js'
import * as testAttemptService from '../services/testAttemptService.js'

export const listAvailableTests = asyncHandler(async (req, res) => {
  const { webinarId, page = 1, limit = 20 } = req.query
  const result = await freelancerTestService.listAvailableTests(req.user.id, {
    webinarId: webinarId ? Number(webinarId) : undefined,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Available tests retrieved',
    data: { tests: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getTestInstructions = asyncHandler(async (req, res) => {
  const detail = await freelancerTestService.getTestInstructions(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Test instructions retrieved', data: detail })
})

export const listMyAttempts = asyncHandler(async (req, res) => {
  const { testId } = req.query
  const attempts = await freelancerTestService.listMyAttempts(req.user.id, {
    testId: testId ? Number(testId) : undefined,
  })
  sendSuccess(res, { message: 'Your attempts retrieved', data: { attempts } })
})

export const startAttempt = asyncHandler(async (req, res) => {
  const session = await testAttemptService.startAttempt(Number(req.params.id), req.user.id)
  sendSuccess(res, { statusCode: 201, message: 'Test attempt started', data: session })
})
