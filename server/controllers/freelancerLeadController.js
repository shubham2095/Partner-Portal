import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as freelancerLeadService from '../services/freelancerLeadService.js'
import * as freelancerCommissionService from '../services/freelancerCommissionService.js'
import * as followUpService from '../services/followUpService.js'

function toFollowUpPayload(body) {
  const payload = {}
  if (body.scheduledAt !== undefined) payload.scheduled_at = body.scheduledAt
  if (body.followUpType !== undefined) payload.follow_up_type = body.followUpType
  if (body.priority !== undefined) payload.priority = body.priority
  if (body.notes !== undefined) payload.notes = body.notes
  return payload
}

async function buildActor(req) {
  const freelancerProfileId = await freelancerLeadService.resolveFreelancerProfileId(req.user.id)
  return { isAdmin: false, userId: req.user.id, freelancerProfileId }
}

function toCreateLeadPayload(body) {
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
    nextFollowUpDate: body.nextFollowUpDate,
    followUpType: body.followUpType,
  }
}

export const createMyLead = asyncHandler(async (req, res) => {
  const lead = await freelancerLeadService.createMyLead(toCreateLeadPayload(req.body), req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Lead created', data: { lead } })
})

export const listMyLeads = asyncHandler(async (req, res) => {
  const { status, search, sortBy, sortDir, page = 1, limit = 20 } = req.query
  const result = await freelancerLeadService.listMyLeads(req.user.id, {
    status,
    search,
    sortBy,
    sortDir,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Your leads retrieved',
    data: { leads: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getMyLeadDetail = asyncHandler(async (req, res) => {
  const lead = await freelancerLeadService.getMyLeadDetail(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Lead detail retrieved', data: { lead } })
})

export const changeMyLeadStatus = asyncHandler(async (req, res) => {
  const lead = await freelancerLeadService.changeMyLeadStatus(
    Number(req.params.id),
    { status: req.body.status, conversionValue: req.body.conversionValue },
    req.user.id,
    req
  )
  sendSuccess(res, { message: 'Lead status updated', data: { lead } })
})

export const getMyLeadTimeline = asyncHandler(async (req, res) => {
  const timeline = await freelancerLeadService.getMyLeadTimeline(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Lead timeline retrieved', data: timeline })
})

export const addMyActivity = asyncHandler(async (req, res) => {
  const activity = await freelancerLeadService.addMyActivity(
    Number(req.params.id),
    { activityType: req.body.activityType, description: req.body.description },
    req.user.id
  )
  sendSuccess(res, { statusCode: 201, message: 'Activity recorded', data: { activity } })
})

// Closed deal / commission contract submission

export const getMyClosedDeal = asyncHandler(async (req, res) => {
  const commission = await freelancerCommissionService.getMyDealForLead(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Closed deal status retrieved', data: { commission } })
})

export const submitClosedDeal = asyncHandler(async (req, res) => {
  const commission = await freelancerCommissionService.submitClosedDeal(
    Number(req.params.id),
    req.user.id,
    {
      declarationNote: req.body.declarationNote,
      termsAccepted: req.body.termsAccepted,
      dealClosingDate: req.body.dealClosingDate,
    },
    req.file,
    req
  )
  sendSuccess(res, { statusCode: 201, message: 'Closed deal submitted for review', data: { commission } })
})

// Follow-ups

export const listFollowUpsForLead = asyncHandler(async (req, res) => {
  const actor = await buildActor(req)
  const followUps = await followUpService.listFollowUpsForLead(Number(req.params.id), actor)
  sendSuccess(res, { message: 'Follow-ups retrieved', data: { followUps } })
})

export const listFollowUps = asyncHandler(async (req, res) => {
  const actor = await buildActor(req)
  const { bucket, status, followUpType, priority, search, page = 1, limit = 20 } = req.query
  const result = await followUpService.listFollowUps(
    { bucket, status, followUpType, priority, search, page: Number(page), limit: Number(limit) },
    actor
  )
  sendSuccess(res, {
    message: 'Follow-ups retrieved',
    data: { followUps: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const createFollowUp = asyncHandler(async (req, res) => {
  const actor = await buildActor(req)
  const followUp = await followUpService.createFollowUp(
    Number(req.params.id),
    { scheduledAt: req.body.scheduledAt, followUpType: req.body.followUpType, priority: req.body.priority, notes: req.body.notes },
    actor
  )
  sendSuccess(res, { statusCode: 201, message: 'Follow-up created', data: { followUp } })
})

export const updateFollowUp = asyncHandler(async (req, res) => {
  const actor = await buildActor(req)
  const followUp = await followUpService.updateFollowUp(Number(req.params.followUpId), toFollowUpPayload(req.body), actor)
  sendSuccess(res, { message: 'Follow-up updated', data: { followUp } })
})

export const completeFollowUp = asyncHandler(async (req, res) => {
  const actor = await buildActor(req)
  const followUp = await followUpService.completeFollowUp(
    Number(req.params.followUpId),
    { outcome: req.body.outcome, nextFollowUpDate: req.body.nextFollowUpDate },
    actor
  )
  sendSuccess(res, { message: 'Follow-up completed', data: { followUp } })
})

export const cancelFollowUp = asyncHandler(async (req, res) => {
  const actor = await buildActor(req)
  const followUp = await followUpService.cancelFollowUp(Number(req.params.followUpId), actor)
  sendSuccess(res, { message: 'Follow-up cancelled', data: { followUp } })
})
