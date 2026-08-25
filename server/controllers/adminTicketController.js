import path from 'node:path'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as adminTicketService from '../services/adminTicketService.js'

export const listTickets = asyncHandler(async (req, res) => {
  const { status, category, priority, assignedAdminId, freelancerId, search, page = 1, limit = 20 } = req.query
  const result = await adminTicketService.listTickets({
    status,
    category,
    priority,
    assignedAdminId: assignedAdminId ? Number(assignedAdminId) : undefined,
    freelancerId: freelancerId ? Number(freelancerId) : undefined,
    search,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Tickets retrieved',
    data: { tickets: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getTicketDetail = asyncHandler(async (req, res) => {
  const detail = await adminTicketService.getTicketDetail(Number(req.params.id))
  sendSuccess(res, { message: 'Ticket detail retrieved', data: detail })
})

export const listAssignableAdmins = asyncHandler(async (req, res) => {
  const admins = await adminTicketService.listAssignableAdmins()
  sendSuccess(res, { message: 'Assignable admins retrieved', data: { admins } })
})

export const getDashboardCounts = asyncHandler(async (req, res) => {
  const counts = await adminTicketService.getDashboardCounts()
  sendSuccess(res, { message: 'Ticket dashboard counts retrieved', data: counts })
})

export const assignTicket = asyncHandler(async (req, res) => {
  const ticket = await adminTicketService.assignTicket(Number(req.params.id), Number(req.body.adminId), req.user.id, req)
  sendSuccess(res, { message: 'Ticket assigned', data: { ticket } })
})

export const changePriority = asyncHandler(async (req, res) => {
  const ticket = await adminTicketService.changePriority(Number(req.params.id), req.body.priority, req.user.id, req)
  sendSuccess(res, { message: 'Ticket priority updated', data: { ticket } })
})

export const changeStatus = asyncHandler(async (req, res) => {
  const ticket = await adminTicketService.changeStatus(Number(req.params.id), req.body.status, req.user.id, req)
  sendSuccess(res, { message: 'Ticket status updated', data: { ticket } })
})

export const replyToTicket = asyncHandler(async (req, res) => {
  const ticket = await adminTicketService.replyToTicket(Number(req.params.id), req.user.id, { message: req.body.message }, req.file, req)
  sendSuccess(res, { statusCode: 201, message: 'Reply posted', data: { ticket } })
})

export const downloadAttachment = asyncHandler(async (req, res) => {
  const attachment = await adminTicketService.getAttachment(Number(req.params.id), Number(req.params.attachmentId))
  const absolutePath = path.join(process.cwd(), attachment.file_path)
  res.download(absolutePath, attachment.original_filename)
})
