import apiClient from './apiClient'

export async function listNotifications(params) {
  const { data } = await apiClient.get('/notifications', { params })
  return data
}

export async function getUnreadCount() {
  const { data } = await apiClient.get('/notifications/unread-count')
  return data.data.count
}

export async function markRead(id) {
  await apiClient.post(`/notifications/${id}/read`)
}

export async function markAllRead() {
  await apiClient.post('/notifications/read-all')
}

export async function getPreferences() {
  const { data } = await apiClient.get('/notifications/preferences')
  return data.data.preferences
}

export async function updatePreferences(payload) {
  const { data } = await apiClient.put('/notifications/preferences', payload)
  return data.data.preferences
}
