import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { corsOptions } from './config/cors.js'
import { requestLogger } from './middleware/requestLogger.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import { generalLimiter } from './middleware/rateLimiter.js'
import apiRoutes from './routes/index.js'

const app = express()

// In production the app runs behind Hostinger's reverse proxy, so the real
// client IP arrives in X-Forwarded-For. Without this, express-rate-limit keys
// every request by the proxy's single IP and one busy user throttles everyone.
// Trust exactly one proxy hop rather than `true` (which would let a client
// spoof its own X-Forwarded-For and dodge the limiter).
if (env.isProduction) {
  app.set('trust proxy', 1)
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors(corsOptions))
app.use(
  express.json({
    // Capture the raw request bytes alongside the parsed body so webhook
    // routes (Meta) can verify an HMAC signature computed over the exact
    // bytes the provider sent — re-serializing req.body would not match.
    verify: (req, res, buf) => {
      req.rawBody = buf
    },
  })
)
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

app.use(`/api/${env.apiVersion}`, generalLimiter, apiRoutes)

// Serve the built frontend (client/dist copied alongside this server) when present.
// Lets a single Node deployment host both the API and the React app on one domain.
const clientDistPath = path.join(process.cwd(), 'dist')
const clientIndexPath = path.join(clientDistPath, 'index.html')

if (fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath))
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(clientIndexPath)
  })
}

app.use(notFound)
app.use(errorHandler)

export default app
