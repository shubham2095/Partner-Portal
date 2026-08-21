import cron from 'node-cron'
import { env } from '../config/env.js'
import { runFollowUpReminderJob } from './followUpReminderJob.js'

let started = false

export function startScheduler() {
  if (started || !env.automation.schedulerEnabled) return
  started = true

  cron.schedule(env.automation.followupReminderCron, async () => {
    try {
      const result = await runFollowUpReminderJob()
      if (result.processed > 0) {
        console.log(
          `[scheduler] followup_reminders: processed=${result.processed} succeeded=${result.succeeded} failed=${result.failed}`
        )
      }
    } catch (error) {
      // A failed run must never crash the process — log and let the next
      // scheduled tick try again.
      console.error('[scheduler] followup_reminders job crashed:', error.message)
    }
  })

  console.log(`[scheduler] Follow-up reminder job scheduled (${env.automation.followupReminderCron})`)
}
