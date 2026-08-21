import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication token is required'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] })
    req.user = {
      id: payload.sub,
      role: payload.role,
    }
    next()
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired authentication token'))
  }
}
