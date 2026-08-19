import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import { findTestById, listTests } from '../models/testModel.js'
import { countQuestionsForTest } from '../models/testQuestionModel.js'
import { countAttemptsByFreelancerTest, listAttemptsByFreelancer } from '../models/testAttemptModel.js'

async function requireProfile(userId) {
  const profile = await findProfileByUserId(userId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }
  return profile
}

export async function listAvailableTests(userId, { webinarId, page, limit }) {
  const profile = await requireProfile(userId)
  const { rows, total } = await listTests({ status: 'ACTIVE', webinarId, page, limit })

  const enriched = await Promise.all(
    rows.map(async (test) => {
      const attemptsUsed = await countAttemptsByFreelancerTest(test.id, profile.id)
      return { ...test, attemptsUsed, attemptsRemaining: Math.max(0, test.max_attempts - attemptsUsed) }
    })
  )

  return { rows: enriched, total, page, limit }
}

export async function getTestInstructions(testId, userId) {
  const profile = await requireProfile(userId)
  const test = await findTestById(testId)
  if (!test || test.status !== 'ACTIVE') {
    throw new ApiError(404, 'Test not found')
  }

  const questionCount = await countQuestionsForTest(testId)
  const attemptsUsed = await countAttemptsByFreelancerTest(testId, profile.id)

  return {
    test: { ...test, question_count: questionCount },
    attemptsUsed,
    attemptsRemaining: Math.max(0, test.max_attempts - attemptsUsed),
    canAttempt: attemptsUsed < test.max_attempts,
  }
}

export async function listMyAttempts(userId, { testId } = {}) {
  const profile = await requireProfile(userId)
  return listAttemptsByFreelancer(profile.id, { testId })
}
