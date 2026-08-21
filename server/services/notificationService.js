import { pool } from '../config/database.js'
import {
  createNotification,
  findNotificationById,
  listNotificationsForUser,
  countUnread,
  markAsRead,
  markAllAsRead,
  listAdminUserIds,
} from '../models/notificationModel.js'
import { createDelivery } from '../models/notificationDeliveryModel.js'
import { findPreferencesByUserId } from '../models/notificationPreferenceModel.js'
import { isProviderEnabled } from '../models/integrationConfigModel.js'
import { sendEmail } from './emailService.js'
import { sendWhatsAppMessage } from './whatsappService.js'

async function getRecipientContact(userId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT u.email, fp.mobile
     FROM users u
     LEFT JOIN freelancer_profiles fp ON fp.user_id = u.id
     WHERE u.id = ? LIMIT 1`,
    [userId]
  )
  return rows[0] ?? null
}

/**
 * Creates an in-app notification and best-effort dispatches it over
 * additional channels (email/WhatsApp) according to the recipient's
 * preferences and integration configuration. Failures on optional
 * channels never throw — the in-app notification always succeeds.
 */
export async function notify({
  recipientUserId,
  type,
  title,
  message,
  relatedEntityType,
  relatedEntityId,
  emailSubject,
  emailHtml,
  whatsappMessage,
}) {
  const notificationId = await createNotification({
    recipientUserId,
    type,
    title,
    message,
    relatedEntityType,
    relatedEntityId,
  })

  const contact = await getRecipientContact(recipientUserId)
  const preferences = await findPreferencesByUserId(recipientUserId)
  const emailEnabled = preferences ? Boolean(preferences.email_enabled) : true
  const whatsappEnabled = preferences ? Boolean(preferences.whatsapp_enabled) : true

  if (emailEnabled && contact?.email && emailSubject) {
    try {
      await sendEmail({ to: contact.email, subject: emailSubject, html: emailHtml ?? `<p>${message ?? title}</p>` })
      await createDelivery({ notificationId, channel: 'EMAIL', status: 'SENT' })
    } catch (error) {
      await createDelivery({ notificationId, channel: 'EMAIL', status: 'FAILED', errorMessage: error.message })
    }
  }

  if (whatsappEnabled && contact?.mobile && whatsappMessage && (await isProviderEnabled('WHATSAPP'))) {
    const result = await sendWhatsAppMessage({ to: contact.mobile, message: whatsappMessage })
    await createDelivery({
      notificationId,
      channel: 'WHATSAPP',
      status: result.success ? 'SENT' : 'FAILED',
      providerResponse: result.mocked ? 'mocked' : JSON.stringify(result.providerResponse ?? {}),
      errorMessage: result.success ? null : result.reason,
    })
  }

  return findNotificationById(notificationId)
}

export async function notifyAdmins(payload) {
  const adminIds = await listAdminUserIds()
  return Promise.all(adminIds.map((adminId) => notify({ ...payload, recipientUserId: adminId })))
}

export async function listMyNotifications(userId, { unreadOnly, page, limit }) {
  const { rows, total } = await listNotificationsForUser({ userId, unreadOnly, page, limit })
  return { rows, total, page, limit }
}

export async function getUnreadCount(userId) {
  return countUnread(userId)
}

export async function markNotificationRead(id, userId) {
  await markAsRead(id, userId)
}

export async function markAllNotificationsRead(userId) {
  await markAllAsRead(userId)
}
