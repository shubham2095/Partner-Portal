import apiClient from './apiClient'

export async function listTrainings(params) {
  const { data } = await apiClient.get('/freelancer/training', { params })
  return data
}

export async function getTrainingDetail(id) {
  const { data } = await apiClient.get(`/freelancer/training/${id}`)
  return data.data
}

export async function listMyEnrollments() {
  const { data } = await apiClient.get('/freelancer/training/enrollments')
  return data.data.enrollments
}

export async function getDashboardSummary() {
  const { data } = await apiClient.get('/freelancer/training/dashboard')
  return data.data
}

export async function markLessonComplete(lessonId) {
  const { data } = await apiClient.post(`/freelancer/training/lessons/${lessonId}/complete`)
  return data.data.progress
}

export async function saveVideoProgress(videoId, positionSeconds) {
  const { data } = await apiClient.post(`/freelancer/training/videos/${videoId}/progress`, { positionSeconds })
  return data.data.progress
}

export async function downloadMaterial(materialId, fileName) {
  const response = await apiClient.get(`/freelancer/training/materials/${materialId}/download`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || 'material'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
