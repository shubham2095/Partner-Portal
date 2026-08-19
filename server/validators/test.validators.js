import { param, query, body } from 'express-validator'

const TEST_STATUSES = ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED']
const ATTEMPT_RESULTS = ['PASS', 'FAIL']
const ATTEMPT_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'EVALUATED']

export const listTestsValidator = [
  query('status').optional().isIn(TEST_STATUSES),
  query('webinarId').optional().isInt({ min: 1 }),
  query('search').optional().trim().isLength({ max: 150 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const testIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid test id')]
export const testIdQueryParamValidator = [param('testId').isInt({ min: 1 }).withMessage('Invalid test id')]

export const createTestValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('instructions').optional({ values: 'null' }).trim(),
  body('webinarId').optional({ values: 'null' }).isInt({ min: 1 }),
  body('durationMinutes').isInt({ min: 1 }).withMessage('Duration in minutes is required'),
  body('passingPercentage').isFloat({ min: 0, max: 100 }).withMessage('Passing percentage must be between 0 and 100'),
  body('maxAttempts').optional().isInt({ min: 1 }),
  body('negativeMarkingEnabled').optional().isBoolean(),
  body('randomizeQuestions').optional().isBoolean(),
  body('questionCount').optional().isInt({ min: 0 }),
]

export const updateTestValidator = [
  body('title').optional().trim().isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('instructions').optional({ values: 'null' }).trim(),
  body('webinarId').optional({ values: 'null' }).isInt({ min: 1 }),
  body('durationMinutes').optional().isInt({ min: 1 }),
  body('passingPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('maxAttempts').optional().isInt({ min: 1 }),
  body('negativeMarkingEnabled').optional().isBoolean(),
  body('randomizeQuestions').optional().isBoolean(),
  body('questionCount').optional().isInt({ min: 0 }),
]

export const changeTestStatusValidator = [body('status').isIn(TEST_STATUSES).withMessage('Invalid test status')]

export const addTestQuestionValidator = [body('questionId').isInt({ min: 1 }).withMessage('A valid question id is required')]

export const testQuestionIdParamValidator = [
  param('questionId').isInt({ min: 1 }).withMessage('Invalid question id'),
]

export const reorderTestQuestionsValidator = [
  body('orderedQuestionIds').isArray({ min: 1 }).withMessage('orderedQuestionIds must be a non-empty array'),
  body('orderedQuestionIds.*').isInt({ min: 1 }),
]

export const listTestAttemptsValidator = [
  query('freelancerId').optional().isInt({ min: 1 }),
  query('result').optional().isIn(ATTEMPT_RESULTS),
  query('status').optional().isIn(ATTEMPT_STATUSES),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]
