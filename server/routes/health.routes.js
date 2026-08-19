import { Router } from 'express'
import { sendSuccess } from '../utils/apiResponse.js'
import { testConnection } from '../config/database.js'

const router = Router()

router.get('/', async (req, res) => {
  let database = 'unknown'

  try {
    await testConnection()
    database = 'connected'
  } catch (error) {
    database = 'disconnected'
  }

  sendSuccess(res, {
    message: 'API is healthy',
    data: {
      status: 'ok',
      database,
      timestamp: new Date().toISOString(),
    },
  })
})

export default router
