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
import apiRoutes from './routes/index.js'

const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

app.use(`/api/${env.apiVersion}`, apiRoutes)

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
