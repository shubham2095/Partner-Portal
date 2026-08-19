import apiClient from './apiClient'

export async function listQuestions(params) {
  const { data } = await apiClient.get('/admin/questions', { params })
  return data
}

export async function getQuestionDetail(id) {
  const { data } = await apiClient.get(`/admin/questions/${id}`)
  return data.data.question
}

export async function createQuestion(payload) {
  const { data } = await apiClient.post('/admin/questions', payload)
  return data.data.question
}

export async function updateQuestion(id, payload) {
  const { data } = await apiClient.patch(`/admin/questions/${id}`, payload)
  return data.data.question
}

export async function setQuestionStatus(id, status) {
  const { data } = await apiClient.post(`/admin/questions/${id}/status`, { status })
  return data.data.question
}
