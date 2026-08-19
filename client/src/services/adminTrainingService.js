import apiClient from './apiClient'

// Categories
export async function listCategories(params) {
  const { data } = await apiClient.get('/admin/training/categories', { params })
  return data.data.categories
}

export async function createCategory(payload) {
  const { data } = await apiClient.post('/admin/training/categories', payload)
  return data.data.category
}

export async function updateCategory(id, payload) {
  const { data } = await apiClient.patch(`/admin/training/categories/${id}`, payload)
  return data.data.category
}

// Trainings
export async function listTrainings(params) {
  const { data } = await apiClient.get('/admin/training', { params })
  return data
}

export async function createTraining(payload) {
  const { data } = await apiClient.post('/admin/training', payload)
  return data.data.training
}

export async function getTrainingDetail(id) {
  const { data } = await apiClient.get(`/admin/training/${id}`)
  return data.data
}

export async function updateTraining(id, payload) {
  const { data } = await apiClient.patch(`/admin/training/${id}`, payload)
  return data.data.training
}

export async function changeTrainingStatus(id, status) {
  const { data } = await apiClient.post(`/admin/training/${id}/status`, { status })
  return data.data.training
}

// Modules
export async function addModule(trainingId, payload) {
  const { data } = await apiClient.post(`/admin/training/${trainingId}/modules`, payload)
  return data.data.module
}

export async function updateModule(moduleId, payload) {
  const { data } = await apiClient.patch(`/admin/training/modules/${moduleId}`, payload)
  return data.data.module
}

export async function removeModule(moduleId) {
  await apiClient.delete(`/admin/training/modules/${moduleId}`)
}

// Lessons
export async function addLesson(moduleId, payload) {
  const { data } = await apiClient.post(`/admin/training/modules/${moduleId}/lessons`, payload)
  return data.data.lesson
}

export async function updateLesson(lessonId, payload) {
  const { data } = await apiClient.patch(`/admin/training/lessons/${lessonId}`, payload)
  return data.data.lesson
}

export async function removeLesson(lessonId) {
  await apiClient.delete(`/admin/training/lessons/${lessonId}`)
}

// Materials
export async function uploadMaterial(lessonId, formData) {
  const { data } = await apiClient.post(`/admin/training/lessons/${lessonId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data.material
}

export async function removeMaterial(materialId) {
  await apiClient.delete(`/admin/training/materials/${materialId}`)
}

export function getMaterialDownloadUrl(materialId) {
  return `/admin/training/materials/${materialId}/download`
}

export async function downloadMaterial(materialId) {
  const { data } = await apiClient.get(getMaterialDownloadUrl(materialId), { responseType: 'blob' })
  return data
}

// Videos
export async function addVideo(lessonId, payload) {
  const { data } = await apiClient.post(`/admin/training/lessons/${lessonId}/videos`, payload)
  return data.data.video
}

export async function updateVideo(videoId, payload) {
  const { data } = await apiClient.patch(`/admin/training/videos/${videoId}`, payload)
  return data.data.video
}

export async function removeVideo(videoId) {
  await apiClient.delete(`/admin/training/videos/${videoId}`)
}
