import apiClient from './apiClient'

export async function verifyCertificate(certificateNumber) {
  const { data } = await apiClient.get(`/verify/certificate/${certificateNumber}`)
  return data.data
}
