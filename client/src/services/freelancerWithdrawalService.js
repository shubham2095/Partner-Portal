import apiClient from './apiClient'

export async function getMyAvailableBalance() {
  const { data } = await apiClient.get('/freelancer/withdrawals/available-balance')
  return data.data.availableBalance
}

export async function getMyWithdrawalSummary() {
  const { data } = await apiClient.get('/freelancer/withdrawals/summary')
  return data.data
}

export async function listMyWithdrawals(params) {
  const { data } = await apiClient.get('/freelancer/withdrawals', { params })
  return data
}

export async function getMyWithdrawalDetail(id) {
  const { data } = await apiClient.get(`/freelancer/withdrawals/${id}`)
  return data.data
}

export async function requestWithdrawal(amount) {
  const { data } = await apiClient.post('/freelancer/withdrawals', { amount })
  return data.data.withdrawal
}
