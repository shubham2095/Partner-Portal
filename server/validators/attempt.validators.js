import { param, body } from 'express-validator'

export const attemptIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid attempt id')]

export const saveAnswerValidator = [
  body('questionId').isInt({ min: 1 }).withMessage('A valid question id is required'),
  body('selectedAnswer').optional({ values: 'null' }).trim().isLength({ max: 10 }),
]
