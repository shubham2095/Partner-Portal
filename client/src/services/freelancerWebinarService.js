import apiClient from './apiClient'

export async function listAvailableWebinars(params) {
  const { data } = await apiClient.get('/freelancer/webinars', { params })
  return data
}

export async function getWebinarDetail(id) {
  const { data } = await apiClient.get(`/freelancer/webinars/${id}`)
  return data.data
}

export async function registerForWebinar(id, payload = {}) {
  const { data } = await apiClient.post(`/freelancer/webinars/${id}/register`, payload)
  return data.data.registration
}

export async function listMyRegistrations() {
  const { data } = await apiClient.get('/freelancer/webinars/registrations')
  return data.data.registrations
}
