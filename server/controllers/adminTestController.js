import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as adminTestService from '../services/adminTestService.js'

export const listTests = asyncHandler(async (req, res) => {
  const { status, webinarId, search, page = 1, limit = 20 } = req.query
  const result = await adminTestService.listTestsAdmin({
    status,
    webinarId: webinarId ? Number(webinarId) : undefined,
    search,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Tests retrieved',
    data: { tests: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const createTest = asyncHandler(async (req, res) => {
  const test = await adminTestService.createTest(req.body, req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Test created', data: { test } })
})

export const getTestDetail = asyncHandler(async (req, res) => {
  const detail = await adminTestService.getTestDetail(Number(req.params.id))
  sendSuccess(res, { message: 'Test detail retrieved', data: detail })
})

export const updateTest = asyncHandler(async (req, res) => {
  const test = await adminTestService.updateTest(Number(req.params.id), req.body, req.user.id, req)
  sendSuccess(res, { message: 'Test updated', data: { test } })
})

export const changeTestStatus = asyncHandler(async (req, res) => {
  const test = await adminTestService.changeTestStatus(Number(req.params.id), req.body.status, req.user.id, req)
  sendSuccess(res, { message: 'Test status updated', data: { test } })
})

export const addQuestion = asyncHandler(async (req, res) => {
  const questions = await adminTestService.addQuestion(Number(req.params.id), req.body.questionId, req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Question added to test', data: { questions } })
})

export const removeQuestion = asyncHandler(async (req, res) => {
  const questions = await adminTestService.removeQuestion(
    Number(req.params.id),
    Number(req.params.questionId),
    req.user.id,
    req
  )
  sendSuccess(res, { message: 'Question removed from test', data: { questions } })
})

export const reorderQuestions = asyncHandler(async (req, res) => {
  const questions = await adminTestService.reorderQuestions(
    Number(req.params.id),
    req.body.orderedQuestionIds,
    req.user.id,
    req
  )
  sendSuccess(res, { message: 'Questions reordered', data: { questions } })
})

export const listTestAttempts = asyncHandler(async (req, res) => {
  const { freelancerId, result, status, page = 1, limit = 20 } = req.query
  const attempts = await adminTestService.listTestAttempts(Number(req.params.id), {
    freelancerId: freelancerId ? Number(freelancerId) : undefined,
    result,
    status,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Test attempts retrieved',
    data: { attempts: attempts.rows },
    meta: { total: attempts.total, page: attempts.page, limit: attempts.limit },
  })
})
