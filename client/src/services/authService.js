import apiClient from './apiClient'

export async function registerFreelancer(payload) {
  const { data } = await apiClient.post('/auth/register', payload)
  return data.data
}

export async function loginFreelancer(payload) {
  const { data } = await apiClient.post('/auth/login/freelancer', payload)
  return data.data
}

export async function loginAdmin(payload) {
  const { data } = await apiClient.post('/auth/login/admin', payload)
  return data.data
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me')
  return data.data.user
}

export async function logoutUser() {
  await apiClient.post('/auth/logout')
}

export async function verifyEmail(token) {
  const { data } = await apiClient.post('/auth/verify-email', { token })
  return data
}

export async function forgotPassword(email) {
  const { data } = await apiClient.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(token, newPassword) {
  const { data } = await apiClient.post('/auth/reset-password', { token, newPassword })
  return data
}
