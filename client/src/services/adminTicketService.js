import apiClient from './apiClient'

export async function listTickets(params) {
  const { data } = await apiClient.get('/admin/tickets', { params })
  return data
}

export async function getTicketDetail(id) {
  const { data } = await apiClient.get(`/admin/tickets/${id}`)
  return data.data
}

export async function listAssignableAdmins() {
  const { data } = await apiClient.get('/admin/tickets/assignable-admins')
  return data.data.admins
}

export async function getDashboardCounts() {
  const { data } = await apiClient.get('/admin/tickets/dashboard-counts')
  return data.data
}

export async function assignTicket(id, adminId) {
  const { data } = await apiClient.post(`/admin/tickets/${id}/assign`, { adminId })
  return data.data.ticket
}

export async function changeStatus(id, status) {
  const { data } = await apiClient.post(`/admin/tickets/${id}/status`, { status })
  return data.data.ticket
}

export async function changePriority(id, priority) {
  const { data } = await apiClient.post(`/admin/tickets/${id}/priority`, { priority })
  return data.data.ticket
}

export async function replyToTicket(id, formData) {
  const { data } = await apiClient.post(`/admin/tickets/${id}/replies`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data.ticket
}

export async function downloadAttachment(ticketId, attachmentId) {
  const { data } = await apiClient.get(`/admin/tickets/${ticketId}/attachments/${attachmentId}`, {
    responseType: 'blob',
  })
  return data
}
