import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as notificationService from '../services/notificationService.js'
import { findPreferencesByUserId, upsertPreferences } from '../models/notificationPreferenceModel.js'

export const listMyNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, page = 1, limit = 20 } = req.query
  const result = await notificationService.listMyNotifications(req.user.id, {
    unreadOnly: unreadOnly === 'true',
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Notifications retrieved',
    data: { notifications: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id)
  sendSuccess(res, { message: 'Unread count retrieved', data: { count } })
})

export const markRead = asyncHandler(async (req, res) => {
  await notificationService.markNotificationRead(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Notification marked as read', data: {} })
})

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsRead(req.user.id)
  sendSuccess(res, { message: 'All notifications marked as read', data: {} })
})

export const getMyPreferences = asyncHandler(async (req, res) => {
  const preferences = await findPreferencesByUserId(req.user.id)
  sendSuccess(res, {
    message: 'Notification preferences retrieved',
    data: { preferences: preferences ?? { email_enabled: 1, whatsapp_enabled: 1 } },
  })
})

export const updateMyPreferences = asyncHandler(async (req, res) => {
  const preferences = await upsertPreferences(req.user.id, {
    emailEnabled: req.body.emailEnabled,
    whatsappEnabled: req.body.whatsappEnabled,
  })
  sendSuccess(res, { message: 'Notification preferences saved', data: { preferences } })
})
