import { findTestById } from '../models/testModel.js'
import { generateCertificateForAttempt } from './certificateService.js'

function isEligible(attempt) {
  return attempt.status === 'EVALUATED' && attempt.result === 'PASS'
}

export async function evaluateCertificationEligibility(attempt, req) {
  if (!isEligible(attempt)) {
    return null
  }

  const test = await findTestById(attempt.test_id)
  if (!test) {
    return null
  }

  return generateCertificateForAttempt(
    {
      freelancerId: attempt.freelancer_id,
      testAttemptId: attempt.id,
      testId: attempt.test_id,
      webinarId: test.webinar_id,
      title: `${test.title} Certification`,
    },
    req
  )
}
