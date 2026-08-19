import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as testAttemptService from '../services/testAttemptService.js'

export const getAttemptSession = asyncHandler(async (req, res) => {
  const session = await testAttemptService.getAttemptSession(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Attempt session retrieved', data: session })
})

export const saveAnswer = asyncHandler(async (req, res) => {
  const result = await testAttemptService.saveAnswer(Number(req.params.id), req.user.id, req.body)
  sendSuccess(res, { message: 'Answer saved', data: result })
})

export const submitAttempt = asyncHandler(async (req, res) => {
  const result = await testAttemptService.submitAttempt(Number(req.params.id), req.user.id, req)
  sendSuccess(res, { message: 'Test submitted', data: result })
})

export const getAttemptResult = asyncHandler(async (req, res) => {
  const result = await testAttemptService.getAttemptResult(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Attempt result retrieved', data: result })
})
