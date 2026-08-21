import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'

function limiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message, errors: {} },
  })
}

// Applied globally to /api — generous baseline so normal application usage
// (dashboards, polling, pagination) is never throttled.
export const generalLimiter = limiter({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  message: 'Too many requests. Please try again later.',
})

// Tighter limit on credential-guessing surfaces (login, register, password
// reset) — these are the endpoints brute-force/credential-stuffing attacks
// actually target.
export const authLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many attempts. Please try again later.',
})

// Public certificate verification has no auth in front of it at all, so it
// gets its own moderate limit distinct from the general API limit.
export const publicVerifyLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Too many verification requests. Please try again later.',
})

// Webhook endpoints receive automated traffic from the provider (retries,
// bursts) so the ceiling is higher than a human-driven endpoint.
export const webhookLimiter = limiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many webhook requests.',
})
