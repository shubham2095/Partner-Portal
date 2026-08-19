import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as adminQuestionService from '../services/adminQuestionService.js'

export const listQuestions = asyncHandler(async (req, res) => {
  const { category, difficulty, status, search, page = 1, limit = 20 } = req.query
  const result = await adminQuestionService.listQuestionsAdmin({
    category,
    difficulty,
    status,
    search,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Questions retrieved',
    data: { questions: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getQuestionDetail = asyncHandler(async (req, res) => {
  const question = await adminQuestionService.getQuestionDetail(Number(req.params.id))
  sendSuccess(res, { message: 'Question detail retrieved', data: { question } })
})

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await adminQuestionService.createQuestion(req.body, req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Question created', data: { question } })
})

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await adminQuestionService.updateQuestion(Number(req.params.id), req.body, req.user.id, req)
  sendSuccess(res, { message: 'Question updated', data: { question } })
})

export const setQuestionStatus = asyncHandler(async (req, res) => {
  const question = await adminQuestionService.setQuestionStatus(Number(req.params.id), req.body.status, req.user.id, req)
  sendSuccess(res, { message: 'Question status updated', data: { question } })
})
