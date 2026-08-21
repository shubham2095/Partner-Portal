import apiClient from './apiClient'

export async function listMyCommissions(params) {
  const { data } = await apiClient.get('/freelancer/commissions', { params })
  return data
}

export async function getMyCommissionDetail(id) {
  const { data } = await apiClient.get(`/freelancer/commissions/${id}`)
  return data.data
}

export async function getMyEarningsSummary() {
  const { data } = await apiClient.get('/freelancer/commissions/summary')
  return data.data
}

export async function getMyPaymentDetails() {
  const { data } = await apiClient.get('/freelancer/commissions/payment-details')
  return data.data.paymentDetails
}

export async function updateMyPaymentDetails(payload) {
  const { data } = await apiClient.put('/freelancer/commissions/payment-details', payload)
  return data.data.paymentDetails
}

export async function listMyPayments() {
  const { data } = await apiClient.get('/freelancer/commissions/payments')
  return data.data.payments
}

export async function getMyLevelHistory() {
  const { data } = await apiClient.get('/freelancer/commissions/level-history')
  return data.data.history
}
