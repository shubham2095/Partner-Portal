import { ApiError } from '../utils/ApiError.js'
import {
  createTest as createTestModel,
  findTestById,
  updateTest as updateTestModel,
  updateTestStatus,
  updateTestTotals,
  listTests,
} from '../models/testModel.js'
import {
  addQuestionToTest as addQuestionToTestModel,
  removeQuestionFromTest as removeQuestionFromTestModel,
  findTestQuestion,
  listQuestionsForTest,
  reorderTestQuestions,
  countQuestionsForTest,
} from '../models/testQuestionModel.js'
import { findQuestionById } from '../models/questionModel.js'
import { listAttemptsForTest } from '../models/testAttemptModel.js'
import { logAudit } from './auditService.js'

const TEST_STATUSES = ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED']

async function requireTest(id) {
  const test = await findTestById(id)
  if (!test) {
    throw new ApiError(404, 'Test not found')
  }
  return test
}

async function recomputeTotals(testId) {
  const questions = await listQuestionsForTest(testId)
  const totalMarks = questions.reduce((sum, question) => sum + Number(question.marks), 0)
  await updateTestTotals(testId, { totalMarks, questionCount: questions.length })
}

export async function listTestsAdmin({ status, webinarId, search, page, limit }) {
  const { rows, total } = await listTests({ status, webinarId, search, page, limit })
  return { rows, total, page, limit }
}

export async function createTest(payload, adminId, req) {
  const id = await createTestModel({ ...payload, createdBy: adminId })
  await logAudit({
    actorId: adminId,
    action: 'TEST_CREATED',
    entity: 'test',
    entityId: id,
    newValue: { title: payload.title, status: 'DRAFT' },
    req,
  })
  return findTestById(id)
}

export async function getTestDetail(id) {
  const test = await requireTest(id)
  const questions = await listQuestionsForTest(id)
  return { test, questions }
}

export async function updateTest(id, fields, adminId, req) {
  const test = await requireTest(id)
  await updateTestModel(id, fields)
  await logAudit({
    actorId: adminId,
    action: 'TEST_UPDATED',
    entity: 'test',
    entityId: id,
    oldValue: test,
    newValue: fields,
    req,
  })
  return findTestById(id)
}

export async function changeTestStatus(id, status, adminId, req) {
  if (!TEST_STATUSES.includes(status)) {
    throw new ApiError(422, 'Invalid test status')
  }
  const test = await requireTest(id)

  if (status === 'PUBLISHED' || status === 'ACTIVE') {
    const questionCount = await countQuestionsForTest(id)
    if (questionCount === 0) {
      throw new ApiError(422, 'Cannot publish a test with no questions attached')
    }
  }

  await updateTestStatus(id, status)
  await logAudit({
    actorId: adminId,
    action: 'TEST_STATUS_CHANGED',
    entity: 'test',
    entityId: id,
    oldValue: { status: test.status },
    newValue: { status },
    req,
  })
  return findTestById(id)
}

export async function addQuestion(testId, questionId, adminId, req) {
  await requireTest(testId)
  const question = await findQuestionById(questionId)
  if (!question) {
    throw new ApiError(404, 'Question not found')
  }

  const existing = await findTestQuestion(testId, questionId)
  if (existing) {
    throw new ApiError(409, 'Question is already attached to this test')
  }

  const displayOrder = await countQuestionsForTest(testId)
  await addQuestionToTestModel({ testId, questionId, displayOrder })
  await recomputeTotals(testId)

  await logAudit({
    actorId: adminId,
    action: 'TEST_QUESTION_ADDED',
    entity: 'test',
    entityId: testId,
    newValue: { questionId },
    req,
  })

  return listQuestionsForTest(testId)
}

export async function removeQuestion(testId, questionId, adminId, req) {
  await requireTest(testId)
  await removeQuestionFromTestModel(testId, questionId)
  await recomputeTotals(testId)

  await logAudit({
    actorId: adminId,
    action: 'TEST_QUESTION_REMOVED',
    entity: 'test',
    entityId: testId,
    oldValue: { questionId },
    req,
  })

  return listQuestionsForTest(testId)
}

export async function reorderQuestions(testId, orderedQuestionIds, adminId, req) {
  await requireTest(testId)
  await reorderTestQuestions(testId, orderedQuestionIds)

  await logAudit({
    actorId: adminId,
    action: 'TEST_QUESTIONS_REORDERED',
    entity: 'test',
    entityId: testId,
    newValue: { orderedQuestionIds },
    req,
  })

  return listQuestionsForTest(testId)
}

export async function listTestAttempts(testId, { freelancerId, result, status, page, limit }) {
  await requireTest(testId)
  const { rows, total } = await listAttemptsForTest({ testId, freelancerId, result, status, page, limit })
  return { rows, total, page, limit }
}
