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

app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

app.use(`/api/${env.apiVersion}`, apiRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
