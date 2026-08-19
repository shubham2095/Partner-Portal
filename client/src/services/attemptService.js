import apiClient from './apiClient'

export async function getAttemptSession(id) {
  const { data } = await apiClient.get(`/freelancer/attempts/${id}`)
  return data.data
}

export async function saveAnswer(id, payload) {
  const { data } = await apiClient.post(`/freelancer/attempts/${id}/answers`, payload)
  return data.data
}

export async function submitAttempt(id) {
  const { data } = await apiClient.post(`/freelancer/attempts/${id}/submit`)
  return data.data
}

export async function getAttemptResult(id) {
  const { data } = await apiClient.get(`/freelancer/attempts/${id}/result`)
  return data.data
}
