import { param, query, body } from 'express-validator'

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD']
const STATUSES = ['ACTIVE', 'INACTIVE']

export const listQuestionsValidator = [
  query('category').optional().trim().isLength({ max: 100 }),
  query('difficulty').optional().isIn(DIFFICULTIES),
  query('status').optional().isIn(STATUSES),
  query('search').optional().trim().isLength({ max: 150 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const questionIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid question id')]

export const createQuestionValidator = [
  body('questionText').trim().notEmpty().withMessage('Question text is required'),
  body('options').isArray({ min: 2 }).withMessage('At least two options are required'),
  body('options.*.key').trim().notEmpty().withMessage('Each option requires a key'),
  body('options.*.text').trim().notEmpty().withMessage('Each option requires text'),
  body('correctAnswer').trim().notEmpty().withMessage('A correct answer is required'),
  body('explanation').optional({ values: 'null' }).trim(),
  body('marks').optional().isFloat({ min: 0 }),
  body('negativeMarks').optional().isFloat({ min: 0 }),
  body('category').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('difficulty').optional().isIn(DIFFICULTIES),
]

export const updateQuestionValidator = [
  body('questionText').optional().trim().notEmpty(),
  body('options').optional().isArray({ min: 2 }),
  body('options.*.key').optional().trim().notEmpty(),
  body('options.*.text').optional().trim().notEmpty(),
  body('correctAnswer').optional().trim().notEmpty(),
  body('explanation').optional({ values: 'null' }).trim(),
  body('marks').optional().isFloat({ min: 0 }),
  body('negativeMarks').optional().isFloat({ min: 0 }),
  body('category').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('difficulty').optional().isIn(DIFFICULTIES),
]

export const setQuestionStatusValidator = [body('status').isIn(STATUSES).withMessage('Invalid question status')]
