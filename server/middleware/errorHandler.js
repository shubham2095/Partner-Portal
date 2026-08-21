import multer from 'multer'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

export function errorHandler(err, req, res, next) {
  // Always log server-side so production failures are diagnosable — only the
  // client-facing response is sanitized below.
  const isApiErrorForLog = err instanceof ApiError
  if (!isApiErrorForLog || err.statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err)
  }

  if (err instanceof multer.MulterError) {
    return res.status(422).json({
      success: false,
      message: `File upload failed: ${err.message}`,
      errors: {},
    })
  }

  const isApiError = err instanceof ApiError
  const statusCode = isApiError ? err.statusCode : 500
  const message = isApiError || !env.isProduction ? err.message : 'Internal server error'

  res.status(statusCode).json({
    success: false,
    message,
    errors: isApiError ? err.errors ?? {} : {},
  })
}
