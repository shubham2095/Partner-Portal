import apiClient from './apiClient'

// Commission rules
export async function listRules(params) {
  const { data } = await apiClient.get('/admin/commissions/rules', { params })
  return data.data.rules
}

export async function createRule(payload) {
  const { data } = await apiClient.post('/admin/commissions/rules', payload)
  return data.data.rule
}

export async function changeRuleStatus(id, status) {
  const { data } = await apiClient.post(`/admin/commissions/rules/${id}/status`, { status })
  return data.data.rule
}

// Commissions
export async function listCommissions(params) {
  const { data } = await apiClient.get('/admin/commissions', { params })
  return data
}

export async function createCommission(leadId) {
  const { data } = await apiClient.post('/admin/commissions', { leadId })
  return data.data.commission
}

export async function getCommissionDetail(id) {
  const { data } = await apiClient.get(`/admin/commissions/${id}`)
  return data.data
}

export async function changeCommissionStatus(id, status) {
  const { data } = await apiClient.post(`/admin/commissions/${id}/status`, { status })
  return data.data.commission
}

export async function rejectCommission(id, reason) {
  const { data } = await apiClient.post(`/admin/commissions/${id}/reject`, { reason })
  return data.data.commission
}

export async function downloadDealDocument(id) {
  const { data } = await apiClient.get(`/admin/commissions/${id}/deal-document`, { responseType: 'blob' })
  return data
}

export async function confirmClientPayment(id) {
  const { data } = await apiClient.post(`/admin/commissions/${id}/confirm-client-payment`)
  return data.data.commission
}

export async function downloadContract(id) {
  const { data } = await apiClient.get(`/admin/commissions/${id}/contract`, { responseType: 'blob' })
  return data
}

// Payments
export async function createPayment(commissionId, formData) {
  const { data } = await apiClient.post(`/admin/commissions/${commissionId}/payments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function listPayments(params) {
  const { data } = await apiClient.get('/admin/commissions/payments', { params })
  return data
}

export async function downloadPaymentProof(commissionId) {
  const { data } = await apiClient.get(`/admin/commissions/${commissionId}/payments/proof`, {
    responseType: 'blob',
  })
  return data
}

// Freelancer payment details (admin view)
export async function getFreelancerPaymentDetails(freelancerId) {
  const { data } = await apiClient.get(`/admin/commissions/freelancers/${freelancerId}/payment-details`)
  return data.data.paymentDetails
}

// Partner level
export async function changePartnerLevel(freelancerId, level, reason) {
  const { data } = await apiClient.post(`/admin/commissions/freelancers/${freelancerId}/level`, { level, reason })
  return data.data.profile
}

export async function getLevelHistory(freelancerId) {
  const { data } = await apiClient.get(`/admin/commissions/freelancers/${freelancerId}/level-history`)
  return data.data.history
}
