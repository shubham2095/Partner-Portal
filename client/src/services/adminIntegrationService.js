import apiClient from './apiClient'

export async function getConfigs() {
  const { data } = await apiClient.get('/admin/integrations/configs')
  return data.data.configs
}

export async function toggleConfig(provider, isEnabled) {
  const { data } = await apiClient.post(`/admin/integrations/configs/${provider}`, { isEnabled })
  return data.data.config
}

export async function getWebhookEvents(params) {
  const { data } = await apiClient.get('/admin/integrations/webhook-events', { params })
  return data
}

export async function getAutomationLogs(params) {
  const { data } = await apiClient.get('/admin/integrations/automation-logs', { params })
  return data
}
