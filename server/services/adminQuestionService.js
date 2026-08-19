import { ApiError } from '../utils/ApiError.js'
import {
  createQuestion as createQuestionModel,
  findQuestionById,
  updateQuestion as updateQuestionModel,
  updateQuestionStatus,
  listQuestions,
} from '../models/questionModel.js'
import { logAudit } from './auditService.js'

function validateOptions(options, correctAnswer) {
  if (!Array.isArray(options) || options.length < 2) {
    throw new ApiError(422, 'A question requires at least two options')
  }
  const keys = options.map((option) => option.key)
  if (new Set(keys).size !== keys.length) {
    throw new ApiError(422, 'Option keys must be unique')
  }
  if (correctAnswer !== undefined && !keys.includes(correctAnswer)) {
    throw new ApiError(422, 'Correct answer must match one of the option keys')
  }
}

async function requireQuestion(id) {
  const question = await findQuestionById(id)
  if (!question) {
    throw new ApiError(404, 'Question not found')
  }
  return question
}

export async function listQuestionsAdmin({ category, difficulty, status, search, page, limit }) {
  const { rows, total } = await listQuestions({ category, difficulty, status, search, page, limit })
  return { rows, total, page, limit }
}

export async function getQuestionDetail(id) {
  return requireQuestion(id)
}

export async function createQuestion(payload, adminId, req) {
  validateOptions(payload.options, payload.correctAnswer)
  const id = await createQuestionModel({ ...payload, createdBy: adminId })
  await logAudit({
    actorId: adminId,
    action: 'QUESTION_CREATED',
    entity: 'question',
    entityId: id,
    newValue: { category: payload.category, difficulty: payload.difficulty },
    req,
  })
  return findQuestionById(id)
}

export async function updateQuestion(id, fields, adminId, req) {
  const question = await requireQuestion(id)
  if (fields.options !== undefined || fields.correctAnswer !== undefined) {
    validateOptions(fields.options ?? question.options, fields.correctAnswer ?? question.correct_answer)
  }

  const columnFields = {}
  if (fields.questionText !== undefined) columnFields.question_text = fields.questionText
  if (fields.options !== undefined) columnFields.options = fields.options
  if (fields.correctAnswer !== undefined) columnFields.correct_answer = fields.correctAnswer
  if (fields.explanation !== undefined) columnFields.explanation = fields.explanation
  if (fields.marks !== undefined) columnFields.marks = fields.marks
  if (fields.negativeMarks !== undefined) columnFields.negative_marks = fields.negativeMarks
  if (fields.category !== undefined) columnFields.category = fields.category
  if (fields.difficulty !== undefined) columnFields.difficulty = fields.difficulty

  await updateQuestionModel(id, columnFields)
  await logAudit({
    actorId: adminId,
    action: 'QUESTION_UPDATED',
    entity: 'question',
    entityId: id,
    oldValue: question,
    newValue: fields,
    req,
  })
  return findQuestionById(id)
}

export async function setQuestionStatus(id, status, adminId, req) {
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new ApiError(422, 'Invalid question status')
  }
  const question = await requireQuestion(id)
  await updateQuestionStatus(id, status)
  await logAudit({
    actorId: adminId,
    action: 'QUESTION_STATUS_CHANGED',
    entity: 'question',
    entityId: id,
    oldValue: { status: question.status },
    newValue: { status },
    req,
  })
  return findQuestionById(id)
}
