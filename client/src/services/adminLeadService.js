import apiClient from './apiClient'

export async function listLeads(params) {
  const { data } = await apiClient.get('/admin/leads', { params })
  return data
}

export async function createLead(payload) {
  const { data } = await apiClient.post('/admin/leads', payload)
  return data.data.lead
}

export async function getLeadDetail(id) {
  const { data } = await apiClient.get(`/admin/leads/${id}`)
  return data.data.lead
}

export async function updateLead(id, payload) {
  const { data } = await apiClient.patch(`/admin/leads/${id}`, payload)
  return data.data.lead
}

export async function changeLeadStatus(id, status, conversionValue) {
  const { data } = await apiClient.post(`/admin/leads/${id}/status`, { status, conversionValue })
  return data.data.lead
}

export async function assignLead(id, freelancerId, note) {
  const { data } = await apiClient.post(`/admin/leads/${id}/assign`, { freelancerId, note })
  return data.data.lead
}

export async function getLeadTimeline(id) {
  const { data } = await apiClient.get(`/admin/leads/${id}/timeline`)
  return data.data
}

export async function addActivity(id, activityType, description) {
  const { data } = await apiClient.post(`/admin/leads/${id}/activities`, { activityType, description })
  return data.data.activity
}

export async function listFollowUpsForLead(id) {
  const { data } = await apiClient.get(`/admin/leads/${id}/followups`)
  return data.data.followUps
}

export async function listFollowUps(params) {
  const { data } = await apiClient.get('/admin/leads/followups', { params })
  return data
}

export async function createFollowUp(leadId, payload) {
  const { data } = await apiClient.post(`/admin/leads/${leadId}/followups`, payload)
  return data.data.followUp
}

export async function updateFollowUp(followUpId, payload) {
  const { data } = await apiClient.patch(`/admin/leads/followups/${followUpId}`, payload)
  return data.data.followUp
}

export async function completeFollowUp(followUpId, outcome, nextFollowUpDate) {
  const { data } = await apiClient.post(`/admin/leads/followups/${followUpId}/complete`, { outcome, nextFollowUpDate })
  return data.data.followUp
}

export async function cancelFollowUp(followUpId) {
  const { data } = await apiClient.post(`/admin/leads/followups/${followUpId}/cancel`)
  return data.data.followUp
}
