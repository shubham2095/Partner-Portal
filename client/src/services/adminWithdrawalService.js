import apiClient from './apiClient'

export async function listWithdrawals(params) {
  const { data } = await apiClient.get('/admin/withdrawals', { params })
  return data
}

export async function getWithdrawalDetail(id) {
  const { data } = await apiClient.get(`/admin/withdrawals/${id}`)
  return data.data
}

export async function approveWithdrawal(id) {
  const { data } = await apiClient.post(`/admin/withdrawals/${id}/approve`)
  return data.data.withdrawal
}

export async function rejectWithdrawal(id, reason) {
  const { data } = await apiClient.post(`/admin/withdrawals/${id}/reject`, { reason })
  return data.data.withdrawal
}

export async function markWithdrawalPaid(id, formData) {
  const { data } = await apiClient.post(`/admin/withdrawals/${id}/mark-paid`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data.withdrawal
}
