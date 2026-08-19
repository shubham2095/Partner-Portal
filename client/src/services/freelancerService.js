import apiClient from './apiClient'

export async function getMyProfile() {
  const { data } = await apiClient.get('/freelancer/profile')
  return data.data.profile
}

export async function updateMyProfile(payload) {
  const { data } = await apiClient.patch('/freelancer/profile', payload)
  return data.data.profile
}

export async function uploadMyProfilePhoto(file) {
  const formData = new FormData()
  formData.append('photo', file)
  const { data } = await apiClient.post('/freelancer/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data.profile
}

export async function listMyDocuments() {
  const { data } = await apiClient.get('/freelancer/documents')
  return data.data.documents
}

export async function uploadMyDocument({ file, documentType }) {
  const formData = new FormData()
  formData.append('document', file)
  formData.append('documentType', documentType)
  const { data } = await apiClient.post('/freelancer/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}
