import apiClient from './apiClient'

export async function listTests(params) {
  const { data } = await apiClient.get('/admin/tests', { params })
  return data
}

export async function createTest(payload) {
  const { data } = await apiClient.post('/admin/tests', payload)
  return data.data.test
}

export async function getTestDetail(id) {
  const { data } = await apiClient.get(`/admin/tests/${id}`)
  return data.data
}

export async function updateTest(id, payload) {
  const { data } = await apiClient.patch(`/admin/tests/${id}`, payload)
  return data.data.test
}

export async function changeTestStatus(id, status) {
  const { data } = await apiClient.post(`/admin/tests/${id}/status`, { status })
  return data.data.test
}

export async function addQuestionToTest(id, questionId) {
  const { data } = await apiClient.post(`/admin/tests/${id}/questions`, { questionId })
  return data.data.questions
}

export async function removeQuestionFromTest(id, questionId) {
  const { data } = await apiClient.delete(`/admin/tests/${id}/questions/${questionId}`)
  return data.data.questions
}

export async function reorderTestQuestions(id, orderedQuestionIds) {
  const { data } = await apiClient.patch(`/admin/tests/${id}/questions/reorder`, { orderedQuestionIds })
  return data.data.questions
}

export async function listTestAttempts(id, params) {
  const { data } = await apiClient.get(`/admin/tests/${id}/attempts`, { params })
  return data
}
