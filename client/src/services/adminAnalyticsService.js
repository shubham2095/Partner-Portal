import apiClient from './apiClient'

export async function getOverview() {
  const { data } = await apiClient.get('/admin/analytics/overview')
  return data.data
}

export async function getLeadsOverTime(params) {
  const { data } = await apiClient.get('/admin/analytics/leads-over-time', { params })
  return data.data
}

export async function getConversionFunnel() {
  const { data } = await apiClient.get('/admin/analytics/conversion-funnel')
  return data.data.funnel
}

export async function getRevenueTrend(params) {
  const { data } = await apiClient.get('/admin/analytics/revenue-trend', { params })
  return data.data
}

export async function getFreelancerPerformance(params) {
  const { data } = await apiClient.get('/admin/analytics/freelancer-performance', { params })
  return { rows: data.data.freelancers, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
}

export async function getWebinarFunnel(params) {
  const { data } = await apiClient.get('/admin/analytics/webinar-funnel', { params })
  return data.data.webinars
}

export async function getSourcePerformance(params) {
  const { data } = await apiClient.get('/admin/analytics/source-performance', { params })
  return data.data
}

export async function getServicePerformance(params) {
  const { data } = await apiClient.get('/admin/analytics/service-performance', { params })
  return data.data
}

export async function getReport(type, params) {
  const { data } = await apiClient.get(`/admin/analytics/reports/${type}`, { params })
  return { rows: data.data.rows, from: data.data.from, to: data.data.to, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
}

export async function exportReport(type, params) {
  const { data } = await apiClient.get(`/admin/analytics/reports/${type}/export`, {
    params,
    responseType: 'blob',
  })
  return data
}
