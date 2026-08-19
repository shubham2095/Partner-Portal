import apiClient from './apiClient'

export async function listCertificates(params) {
  const { data } = await apiClient.get('/admin/certificates', { params })
  return data
}

export async function getCertificateDetail(id) {
  const { data } = await apiClient.get(`/admin/certificates/${id}`)
  return data.data.certificate
}

export async function regenerateCertificatePdf(id) {
  const { data } = await apiClient.post(`/admin/certificates/${id}/regenerate`)
  return data.data.certificate
}

export async function revokeCertificate(id, reason) {
  const { data } = await apiClient.post(`/admin/certificates/${id}/revoke`, { reason })
  return data.data.certificate
}

export async function downloadCertificate(id, fileName) {
  const response = await apiClient.get(`/admin/certificates/${id}/download`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || 'certificate.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
