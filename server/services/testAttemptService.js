import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import { findUserById } from '../models/userModel.js'
import { findTestById } from '../models/testModel.js'
import { listQuestionsForTest } from '../models/testQuestionModel.js'
import { findQuestionsByIds } from '../models/questionModel.js'
import {
  createAttempt,
  findAttemptById,
  findAttemptByIdForUpdate,
  countAttemptsByFreelancerTest,
  findLatestAttempt,
  updateAttemptStart,
  updateAttemptStatus,
  updateAttemptSubmission,
} from '../models/testAttemptModel.js'
import { upsertAnswer, listAnswersByAttempt, updateAnswerEvaluation } from '../models/testAnswerModel.js'
import { evaluateAttempt } from './evaluationService.js'
import { evaluateCertificationEligibility } from './certificationService.js'
import { sendTestResultEmail } from './emailService.js'

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function sanitizeQuestion(question) {
  const { correct_answer, explanation, negative_marks, ...safe } = question
  return safe
}

function remainingSeconds(attempt) {
  if (!attempt.expires_at) return null
  const remaining = Math.floor((new Date(attempt.expires_at).getTime() - Date.now()) / 1000)
  return Math.max(0, remaining)
}

async function requireProfile(userId) {
  const profile = await findProfileByUserId(userId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }
  return profile
}

async function requireOwnedAttempt(attemptId, freelancerId) {
  const attempt = await findAttemptById(attemptId)
  if (!attempt || attempt.freelancer_id !== freelancerId) {
    throw new ApiError(404, 'Test attempt not found')
  }
  return attempt
}

async function buildAttemptQuestionView(attempt) {
  const questions = await findQuestionsByIds(attempt.selected_questions)
  const byId = new Map(questions.map((question) => [question.id, question]))
  const ordered = attempt.selected_questions.map((id) => byId.get(id)).filter(Boolean)
  const answers = await listAnswersByAttempt(attempt.id)
  const answersByQuestion = new Map(answers.map((answer) => [answer.question_id, answer.selected_answer]))

  return ordered.map((question) => ({
    ...sanitizeQuestion(question),
    selectedAnswer: answersByQuestion.get(question.id) ?? null,
  }))
}

export async function startAttempt(testId, userId) {
  const profile = await requireProfile(userId)
  const test = await findTestById(testId)
  if (!test || test.status !== 'ACTIVE') {
    throw new ApiError(404, 'Test not found')
  }

  const latest = await findLatestAttempt(testId, profile.id)
  if (latest && latest.status === 'IN_PROGRESS') {
    if (remainingSeconds(latest) > 0) {
      return getAttemptSession(latest.id, userId)
    }
    await updateAttemptStatus(latest.id, 'EXPIRED')
  }

  const attemptsUsed = await countAttemptsByFreelancerTest(testId, profile.id)
  if (attemptsUsed >= test.max_attempts) {
    throw new ApiError(403, 'You have used all attempts allowed for this test')
  }

  const testQuestions = await listQuestionsForTest(testId)
  if (testQuestions.length === 0) {
    throw new ApiError(422, 'This test has no questions configured')
  }

  const orderedQuestions = test.randomize_questions ? shuffle(testQuestions) : testQuestions
  const questionCount = test.question_count > 0 ? Math.min(test.question_count, orderedQuestions.length) : orderedQuestions.length
  const selectedQuestionIds = orderedQuestions.slice(0, questionCount).map((question) => question.id)

  const attemptId = await createAttempt({
    testId,
    freelancerId: profile.id,
    attemptNumber: attemptsUsed + 1,
    selectedQuestions: selectedQuestionIds,
  })

  const startedAt = new Date()
  const expiresAt = new Date(startedAt.getTime() + test.duration_minutes * 60 * 1000)
  await updateAttemptStart(attemptId, { status: 'IN_PROGRESS', startedAt, expiresAt })

  return getAttemptSession(attemptId, userId)
}

export async function getAttemptSession(attemptId, userId) {
  const profile = await requireProfile(userId)
  const attempt = await requireOwnedAttempt(attemptId, profile.id)

  if (attempt.status === 'IN_PROGRESS' && remainingSeconds(attempt) <= 0) {
    await updateAttemptStatus(attemptId, 'EXPIRED')
    attempt.status = 'EXPIRED'
  }

  if (!['IN_PROGRESS', 'EXPIRED'].includes(attempt.status)) {
    throw new ApiError(409, 'This test attempt is not in progress')
  }

  const test = await findTestById(attempt.test_id)
  const questions = await buildAttemptQuestionView(attempt)

  return {
    attempt: {
      id: attempt.id,
      testId: attempt.test_id,
      attemptNumber: attempt.attempt_number,
      status: attempt.status,
      startedAt: attempt.started_at,
      expiresAt: attempt.expires_at,
      remainingSeconds: remainingSeconds(attempt),
    },
    test: { id: test.id, title: test.title, durationMinutes: test.duration_minutes, instructions: test.instructions },
    questions,
  }
}

export async function saveAnswer(attemptId, userId, { questionId, selectedAnswer }) {
  const profile = await requireProfile(userId)
  const attempt = await requireOwnedAttempt(attemptId, profile.id)

  if (attempt.status !== 'IN_PROGRESS') {
    throw new ApiError(409, 'This test attempt is not in progress')
  }
  if (remainingSeconds(attempt) <= 0) {
    await updateAttemptStatus(attemptId, 'EXPIRED')
    throw new ApiError(409, 'This test attempt has expired')
  }
  if (!attempt.selected_questions.includes(questionId)) {
    throw new ApiError(422, 'Question does not belong to this attempt')
  }

  await upsertAnswer({ attemptId, questionId, selectedAnswer, answeredAt: new Date() })
  return { saved: true }
}

export async function submitAttempt(attemptId, userId, req) {
  const profile = await requireProfile(userId)

  const connection = await pool.getConnection()
  let attempt
  let evaluation
  let test

  try {
    await connection.beginTransaction()
    attempt = await findAttemptByIdForUpdate(attemptId, connection)
    if (!attempt || attempt.freelancer_id !== profile.id) {
      throw new ApiError(404, 'Test attempt not found')
    }
    if (attempt.status === 'EVALUATED' || attempt.status === 'SUBMITTED') {
      throw new ApiError(409, 'This test attempt has already been submitted')
    }
    if (!['IN_PROGRESS', 'EXPIRED'].includes(attempt.status)) {
      throw new ApiError(409, 'This test attempt cannot be submitted')
    }

    test = await findTestById(attempt.test_id)
    const questions = await findQuestionsByIds(attempt.selected_questions)
    const answers = await listAnswersByAttempt(attempt.id)

    evaluation = evaluateAttempt({
      questions,
      answers,
      negativeMarkingEnabled: !!test.negative_marking_enabled,
      passingPercentage: test.passing_percentage,
    })

    for (const item of evaluation.perQuestion) {
      if (item.answerId) {
        await updateAnswerEvaluation(
          item.answerId,
          { isCorrect: item.isCorrect, marksAwarded: item.marksAwarded },
          connection
        )
      }
    }

    const now = new Date()
    const startedAt = new Date(attempt.started_at)
    const durationSeconds = test.duration_minutes * 60
    const timeUsedSeconds = Math.min(durationSeconds, Math.floor((now.getTime() - startedAt.getTime()) / 1000))

    await updateAttemptSubmission(
      attempt.id,
      {
        status: 'EVALUATED',
        submittedAt: now,
        evaluatedAt: now,
        score: evaluation.score,
        percentage: evaluation.percentage,
        result: evaluation.result,
        timeUsedSeconds,
      },
      connection
    )

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  const evaluatedAttempt = await findAttemptById(attemptId)

  try {
    await evaluateCertificationEligibility(evaluatedAttempt, req)
  } catch (error) {
    console.error('[certificationService] Failed to evaluate certification eligibility', error)
  }

  try {
    const user = await findUserById(profile.user_id)
    if (user) {
      await sendTestResultEmail(user.email, {
        testTitle: test.title,
        score: evaluatedAttempt.score,
        percentage: evaluatedAttempt.percentage,
        result: evaluatedAttempt.result,
      })
    }
  } catch (error) {
    console.error('[emailService] Failed to send test result email', error)
  }

  return getAttemptResult(attemptId, userId)
}

export async function getAttemptResult(attemptId, userId) {
  const profile = await requireProfile(userId)
  const attempt = await requireOwnedAttempt(attemptId, profile.id)
  if (attempt.status !== 'EVALUATED') {
    throw new ApiError(409, 'This test attempt has not been evaluated yet')
  }

  const test = await findTestById(attempt.test_id)
  const answers = await listAnswersByAttempt(attempt.id)

  return {
    attempt: {
      id: attempt.id,
      attemptNumber: attempt.attempt_number,
      status: attempt.status,
      submittedAt: attempt.submitted_at,
      score: attempt.score,
      percentage: attempt.percentage,
      result: attempt.result,
      timeUsedSeconds: attempt.time_used_seconds,
    },
    test: { id: test.id, title: test.title, passingPercentage: test.passing_percentage, totalMarks: test.total_marks },
    answers: answers.map((answer) => ({
      questionId: answer.question_id,
      selectedAnswer: answer.selected_answer,
      isCorrect: !!answer.is_correct,
      marksAwarded: answer.marks_awarded,
    })),
  }
}
