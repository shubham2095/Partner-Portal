import apiClient from './apiClient'

export async function listMyTickets(params) {
  const { data } = await apiClient.get('/freelancer/tickets', { params })
  return data
}

export async function createTicket(formData) {
  const { data } = await apiClient.post('/freelancer/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data.ticket
}

export async function getMyTicketDetail(id) {
  const { data } = await apiClient.get(`/freelancer/tickets/${id}`)
  return data.data
}

export async function getMyTicketCounts() {
  const { data } = await apiClient.get('/freelancer/tickets/counts')
  return data.data
}

export async function replyToTicket(id, formData) {
  const { data } = await apiClient.post(`/freelancer/tickets/${id}/replies`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data.ticket
}

export async function downloadMyAttachment(ticketId, attachmentId) {
  const { data } = await apiClient.get(`/freelancer/tickets/${ticketId}/attachments/${attachmentId}`, {
    responseType: 'blob',
  })
  return data
}
