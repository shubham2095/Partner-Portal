import apiClient from './apiClient'

export const getApiHealth = async () => {
  const { data } = await apiClient.get('/health')
  return data
}
