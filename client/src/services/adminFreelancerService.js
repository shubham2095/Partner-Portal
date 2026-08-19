import apiClient from './apiClient'

export async function listFreelancers(params) {
  const { data } = await apiClient.get('/admin/freelancers', { params })
  return data
}

export async function getFreelancerDetail(id) {
  const { data } = await apiClient.get(`/admin/freelancers/${id}`)
  return data.data
}

export async function verifyFreelancerProfile(id) {
  await apiClient.post(`/admin/freelancers/${id}/verify`)
}

export async function rejectFreelancerProfile(id, reason) {
  await apiClient.post(`/admin/freelancers/${id}/reject`, { reason })
}

export async function activateFreelancerAccount(id) {
  await apiClient.post(`/admin/freelancers/${id}/activate`)
}

export async function suspendFreelancerAccount(id) {
  await apiClient.post(`/admin/freelancers/${id}/suspend`)
}

export async function verifyFreelancerDocument(documentId) {
  await apiClient.post(`/admin/documents/${documentId}/verify`)
}

export async function rejectFreelancerDocument(documentId) {
  await apiClient.post(`/admin/documents/${documentId}/reject`)
}
