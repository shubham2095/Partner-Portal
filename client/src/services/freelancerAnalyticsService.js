import apiClient from './apiClient'

export async function getMySummary() {
  const { data } = await apiClient.get('/freelancer/analytics/summary')
  return data.data
}

export async function getMyPipeline() {
  const { data } = await apiClient.get('/freelancer/analytics/pipeline')
  return data.data.pipeline
}

export async function getMyPerformanceTrend(params) {
  const { data } = await apiClient.get('/freelancer/analytics/performance-trend', { params })
  return data.data
}
