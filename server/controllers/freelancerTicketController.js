import path from 'node:path'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as freelancerTicketService from '../services/freelancerTicketService.js'

export const createMyTicket = asyncHandler(async (req, res) => {
  const ticket = await freelancerTicketService.createMyTicket(
    { category: req.body.category, subject: req.body.subject, description: req.body.description, priority: req.body.priority },
    req.user.id,
    req.file,
    req
  )
  sendSuccess(res, { statusCode: 201, message: 'Ticket created', data: { ticket } })
})

export const listMyTickets = asyncHandler(async (req, res) => {
  const { status, category, priority, search, page = 1, limit = 20 } = req.query
  const result = await freelancerTicketService.listMyTickets(req.user.id, {
    status,
    category,
    priority,
    search,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Your tickets retrieved',
    data: { tickets: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getMyTicketDetail = asyncHandler(async (req, res) => {
  const detail = await freelancerTicketService.getMyTicketDetail(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Ticket detail retrieved', data: detail })
})

export const getMyTicketCounts = asyncHandler(async (req, res) => {
  const counts = await freelancerTicketService.getMyTicketCounts(req.user.id)
  sendSuccess(res, { message: 'Ticket counts retrieved', data: counts })
})

export const replyToMyTicket = asyncHandler(async (req, res) => {
  const ticket = await freelancerTicketService.replyToMyTicket(
    Number(req.params.id),
    req.user.id,
    { message: req.body.message },
    req.file,
    req
  )
  sendSuccess(res, { statusCode: 201, message: 'Reply posted', data: { ticket } })
})

export const downloadMyAttachment = asyncHandler(async (req, res) => {
  const attachment = await freelancerTicketService.getMyAttachment(
    Number(req.params.id),
    Number(req.params.attachmentId),
    req.user.id
  )
  const absolutePath = path.join(process.cwd(), attachment.file_path)
  res.download(absolutePath, attachment.original_filename)
})
