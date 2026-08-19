import { validationResult } from 'express-validator'
import { ApiError } from '../utils/ApiError.js'

export function validateRequest(req, res, next) {
  const result = validationResult(req)

  if (!result.isEmpty()) {
    const errors = {}
    for (const error of result.array()) {
      errors[error.path] = error.msg
    }
    return next(new ApiError(422, 'Validation failed', errors))
  }

  next()
}
