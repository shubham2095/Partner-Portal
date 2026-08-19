import apiClient from './apiClient'

export async function listWebinars(params) {
  const { data } = await apiClient.get('/admin/webinars', { params })
  return data
}

export async function createWebinar(payload) {
  const { data } = await apiClient.post('/admin/webinars', payload)
  return data.data.webinar
}

export async function getWebinarDetail(id) {
  const { data } = await apiClient.get(`/admin/webinars/${id}`)
  return data.data
}

export async function updateWebinar(id, payload) {
  const { data } = await apiClient.patch(`/admin/webinars/${id}`, payload)
  return data.data.webinar
}

export async function changeWebinarStatus(id, status) {
  const { data } = await apiClient.post(`/admin/webinars/${id}/status`, { status })
  return data.data.webinar
}

export async function listWebinarRegistrations(id, params) {
  const { data } = await apiClient.get(`/admin/webinars/${id}/registrations`, { params })
  return data
}

export async function markAttendance(webinarId, registrationId, payload) {
  const { data } = await apiClient.post(
    `/admin/webinars/${webinarId}/registrations/${registrationId}/attendance`,
    payload
  )
  return data.data.attendance
}
