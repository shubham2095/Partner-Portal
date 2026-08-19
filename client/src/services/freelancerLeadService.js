import apiClient from './apiClient'

export async function listMyLeads(params) {
  const { data } = await apiClient.get('/freelancer/leads', { params })
  return data
}

export async function getMyLeadDetail(id) {
  const { data } = await apiClient.get(`/freelancer/leads/${id}`)
  return data.data.lead
}

export async function changeMyLeadStatus(id, status, conversionValue) {
  const { data } = await apiClient.post(`/freelancer/leads/${id}/status`, { status, conversionValue })
  return data.data.lead
}

export async function getMyLeadTimeline(id) {
  const { data } = await apiClient.get(`/freelancer/leads/${id}/timeline`)
  return data.data
}

export async function addMyActivity(id, activityType, description) {
  const { data } = await apiClient.post(`/freelancer/leads/${id}/activities`, { activityType, description })
  return data.data.activity
}

export async function listFollowUpsForLead(id) {
  const { data } = await apiClient.get(`/freelancer/leads/${id}/followups`)
  return data.data.followUps
}

export async function listMyFollowUps(params) {
  const { data } = await apiClient.get('/freelancer/leads/followups', { params })
  return data
}

export async function createFollowUp(leadId, payload) {
  const { data } = await apiClient.post(`/freelancer/leads/${leadId}/followups`, payload)
  return data.data.followUp
}

export async function updateFollowUp(followUpId, payload) {
  const { data } = await apiClient.patch(`/freelancer/leads/followups/${followUpId}`, payload)
  return data.data.followUp
}

export async function completeFollowUp(followUpId, outcome, nextFollowUpDate) {
  const { data } = await apiClient.post(`/freelancer/leads/followups/${followUpId}/complete`, {
    outcome,
    nextFollowUpDate,
  })
  return data.data.followUp
}

export async function cancelFollowUp(followUpId) {
  const { data } = await apiClient.post(`/freelancer/leads/followups/${followUpId}/cancel`)
  return data.data.followUp
}
