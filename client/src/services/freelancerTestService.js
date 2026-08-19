import apiClient from './apiClient'

export async function listAvailableTests(params) {
  const { data } = await apiClient.get('/freelancer/tests', { params })
  return data
}

export async function getTestInstructions(id) {
  const { data } = await apiClient.get(`/freelancer/tests/${id}`)
  return data.data
}

export async function listMyAttempts(params) {
  const { data } = await apiClient.get('/freelancer/tests/attempts', { params })
  return data.data.attempts
}

export async function startAttempt(id) {
  const { data } = await apiClient.post(`/freelancer/tests/${id}/attempts`)
  return data.data
}
