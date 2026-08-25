import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as adminLeadService from '../services/adminLeadService.js'
import * as followUpService from '../services/followUpService.js'

function toLeadPayload(body) {
  return {
    clientName: body.clientName,
    company: body.company,
    mobile: body.mobile,
    email: body.email,
    location: body.location,
    businessCategory: body.businessCategory,
    serviceInterested: body.serviceInterested,
    source: body.source,
    leadDate: body.leadDate,
    expectedValue: body.expectedValue,
    notes: body.notes,
  }
}

function toCreateLeadPayload(body) {
  return {
    ...toLeadPayload(body),
    nextFollowUpDate: body.nextFollowUpDate,
    followUpType: body.followUpType,
  }
}

function toFollowUpPayload(body) {
  const payload = {}
  if (body.scheduledAt !== undefined) payload.scheduled_at = body.scheduledAt
  if (body.followUpType !== undefined) payload.follow_up_type = body.followUpType
  if (body.priority !== undefined) payload.priority = body.priority
  if (body.notes !== undefined) payload.notes = body.notes
  return payload
}

export const listLeads = asyncHandler(async (req, res) => {
  const { status, source, assignedFreelancerId, unassigned, search, sortBy, sortDir, page = 1, limit = 20 } = req.query
  const result = await adminLeadService.listLeads({
    status,
    source,
    assignedFreelancerId: assignedFreelancerId ? Number(assignedFreelancerId) : undefined,
    unassigned: unassigned === 'true',
    search,
    sortBy,
    sortDir,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Leads retrieved',
    data: { leads: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const createLead = asyncHandler(async (req, res) => {
  const lead = await adminLeadService.createLead(toCreateLeadPayload(req.body), req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Lead created', data: { lead } })
})

export const getLeadDetail = asyncHandler(async (req, res) => {
  const lead = await adminLeadService.getLeadDetail(Number(req.params.id))
  sendSuccess(res, { message: 'Lead detail retrieved', data: { lead } })
})

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await adminLeadService.updateLead(Number(req.params.id), toLeadPayload(req.body), req.user.id, req)
  sendSuccess(res, { message: 'Lead updated', data: { lead } })
})

export const changeLeadStatus = asyncHandler(async (req, res) => {
  const lead = await adminLeadService.changeLeadStatus(
    Number(req.params.id),
    { status: req.body.status, conversionValue: req.body.conversionValue },
    req.user.id,
    req
  )
  sendSuccess(res, { message: 'Lead status updated', data: { lead } })
})

export const assignLead = asyncHandler(async (req, res) => {
  const lead = await adminLeadService.assignLead(Number(req.params.id), req.body.freelancerId, req.body.note, req.user.id, req)
  sendSuccess(res, { message: 'Lead assignment updated', data: { lead } })
})

export const getLeadTimeline = asyncHandler(async (req, res) => {
  const timeline = await adminLeadService.getLeadTimeline(Number(req.params.id))
  sendSuccess(res, { message: 'Lead timeline retrieved', data: timeline })
})

export const addActivity = asyncHandler(async (req, res) => {
  const activity = await adminLeadService.addActivity(
    Number(req.params.id),
    { activityType: req.body.activityType, description: req.body.description },
    req.user.id,
    req
  )
  sendSuccess(res, { statusCode: 201, message: 'Activity recorded', data: { activity } })
})

// Follow-ups

export const listFollowUpsForLead = asyncHandler(async (req, res) => {
  const followUps = await followUpService.listFollowUpsForLead(Number(req.params.id), {
    isAdmin: true,
    userId: req.user.id,
  })
  sendSuccess(res, { message: 'Follow-ups retrieved', data: { followUps } })
})

export const listFollowUps = asyncHandler(async (req, res) => {
  const { bucket, status, assignedFreelancerId, followUpType, priority, search, page = 1, limit = 20 } = req.query
  const result = await followUpService.listFollowUps(
    {
      bucket,
      status,
      assignedFreelancerId: assignedFreelancerId ? Number(assignedFreelancerId) : undefined,
      followUpType,
      priority,
      search,
      page: Number(page),
      limit: Number(limit),
    },
    { isAdmin: true, userId: req.user.id }
  )
  sendSuccess(res, {
    message: 'Follow-ups retrieved',
    data: { followUps: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const createFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.createFollowUp(
    Number(req.params.id),
    { scheduledAt: req.body.scheduledAt, followUpType: req.body.followUpType, priority: req.body.priority, notes: req.body.notes },
    { isAdmin: true, userId: req.user.id }
  )
  sendSuccess(res, { statusCode: 201, message: 'Follow-up created', data: { followUp } })
})

export const updateFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.updateFollowUp(Number(req.params.followUpId), toFollowUpPayload(req.body), {
    isAdmin: true,
    userId: req.user.id,
  })
  sendSuccess(res, { message: 'Follow-up updated', data: { followUp } })
})

export const completeFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.completeFollowUp(
    Number(req.params.followUpId),
    { outcome: req.body.outcome, nextFollowUpDate: req.body.nextFollowUpDate },
    { isAdmin: true, userId: req.user.id }
  )
  sendSuccess(res, { message: 'Follow-up completed', data: { followUp } })
})

export const cancelFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.cancelFollowUp(Number(req.params.followUpId), {
    isAdmin: true,
    userId: req.user.id,
  })
  sendSuccess(res, { message: 'Follow-up cancelled', data: { followUp } })
})
