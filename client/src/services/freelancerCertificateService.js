import apiClient from './apiClient'

export async function listMyCertificates() {
  const { data } = await apiClient.get('/freelancer/certificates')
  return data.data.certificates
}

export async function getMyCertificateDetail(id) {
  const { data } = await apiClient.get(`/freelancer/certificates/${id}`)
  return data.data.certificate
}

export async function downloadMyCertificate(id, fileName) {
  const response = await apiClient.get(`/freelancer/certificates/${id}/download`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || 'certificate.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
