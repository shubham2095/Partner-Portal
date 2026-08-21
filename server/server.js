import app from './app.js'
import { env } from './config/env.js'
import { startScheduler } from './jobs/scheduler.js'

app.listen(env.port, () => {
  console.log(`Partner Portal API running on http://localhost:${env.port}/api/${env.apiVersion}`)
  startScheduler()
})
