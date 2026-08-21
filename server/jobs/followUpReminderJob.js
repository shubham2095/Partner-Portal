import { env } from '../config/env.js'
import { findFollowUpsDueForReminder, markReminderSent } from '../models/followUpModel.js'
import { createLog } from '../models/automationLogModel.js'
import { notify } from '../services/notificationService.js'

const JOB_NAME = 'followup_reminders'

export async function runFollowUpReminderJob() {
  const due = await findFollowUpsDueForReminder(env.automation.followupReminderWindowMinutes)

  let succeeded = 0
  let failed = 0

  for (const followUp of due) {
    // Claim the row first (idempotent: only one runner can win this UPDATE)
    // before doing anything observable, so a concurrent/duplicate run of
    // this job never sends the same reminder twice.
    const claimed = await markReminderSent(followUp.id)
    if (!claimed) continue

    try {
      if (followUp.user_id) {
        await notify({
          recipientUserId: followUp.user_id,
          type: 'FOLLOWUP_REMINDER',
          title: 'Upcoming follow-up',
          message: `Follow-up for ${followUp.lead_client_name} (${followUp.lead_number}) is due at ${followUp.scheduled_at}.`,
          relatedEntityType: 'follow_up',
          relatedEntityId: followUp.id,
          emailSubject: 'Follow-up reminder',
          emailHtml: `<p>You have a follow-up due for <strong>${followUp.lead_client_name}</strong> (${followUp.lead_number}) at ${followUp.scheduled_at}.</p>`,
        })
      }
      succeeded += 1
    } catch (error) {
      failed += 1
      console.error(`[followUpReminderJob] Failed to notify for follow-up ${followUp.id}:`, error.message)
    }
  }

  await createLog({
    jobName: JOB_NAME,
    recordsProcessed: due.length,
    recordsSucceeded: succeeded,
    recordsFailed: failed,
  })

  return { processed: due.length, succeeded, failed }
}
