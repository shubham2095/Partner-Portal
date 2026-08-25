import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { findLeadById, recomputeLeadFollowUpDate } from '../models/leadModel.js'
import {
  createFollowUp as createFollowUpModel,
  findFollowUpWithLead,
  updateFollowUp as updateFollowUpModel,
  completeFollowUp as completeFollowUpModel,
  cancelFollowUp as cancelFollowUpModel,
  listFollowUpsByLead,
  listFollowUpsAdmin,
  listFollowUpsForFreelancer,
} from '../models/followUpModel.js'
import { createActivity } from '../models/leadActivityModel.js'

async function requireLeadAccess(leadId, actor, executor = pool) {
  const lead = await findLeadById(leadId, executor)
  if (!lead) {
    throw new ApiError(404, 'Lead not found')
  }
  if (!actor.isAdmin && lead.assigned_freelancer_id !== actor.freelancerProfileId) {
    throw new ApiError(404, 'Lead not found')
  }
  return lead
}

async function requireFollowUpAccess(followUpId, actor, executor = pool) {
  const followUp = await findFollowUpWithLead(followUpId, executor)
  if (!followUp) {
    throw new ApiError(404, 'Follow-up not found')
  }
  if (!actor.isAdmin && followUp.assigned_freelancer_id !== actor.freelancerProfileId) {
    throw new ApiError(404, 'Follow-up not found')
  }
  return followUp
}

export async function createFollowUp(leadId, payload, actor) {
  await requireLeadAccess(leadId, actor)

  const id = await createFollowUpModel({
    leadId,
    scheduledAt: payload.scheduledAt,
    followUpType: payload.followUpType,
    priority: payload.priority,
    notes: payload.notes,
    createdBy: actor.userId,
  })

  await recomputeLeadFollowUpDate(leadId)
  await createActivity({
    leadId,
    actorId: actor.userId,
    activityType: 'FOLLOWUP_CREATED',
    description: `Follow-up scheduled (${payload.followUpType})`,
    metadata: { followUpId: id, scheduledAt: payload.scheduledAt },
  })

  const [rows] = await pool.query('SELECT * FROM follow_ups WHERE id = ?', [id])
  return rows[0]
}

export async function updateFollowUp(followUpId, payload, actor) {
  const followUp = await requireFollowUpAccess(followUpId, actor)
  if (followUp.status !== 'PENDING') {
    throw new ApiError(409, 'Only pending follow-ups can be edited')
  }

  await updateFollowUpModel(followUpId, payload)
  if (payload.scheduled_at !== undefined) {
    await recomputeLeadFollowUpDate(followUp.lead_id)
  }

  const [rows] = await pool.query('SELECT * FROM follow_ups WHERE id = ?', [followUpId])
  return rows[0]
}

export async function completeFollowUp(followUpId, { outcome, nextFollowUpDate }, actor) {
  const followUp = await requireFollowUpAccess(followUpId, actor)
  if (followUp.status !== 'PENDING') {
    throw new ApiError(409, 'Only pending follow-ups can be completed')
  }

  await completeFollowUpModel(followUpId, { outcome, nextFollowUpDate })
  await recomputeLeadFollowUpDate(followUp.lead_id)
  await createActivity({
    leadId: followUp.lead_id,
    actorId: actor.userId,
    activityType: 'FOLLOWUP_COMPLETED',
    description: outcome ?? 'Follow-up completed',
    metadata: { followUpId, nextFollowUpDate: nextFollowUpDate ?? null },
  })

  const [rows] = await pool.query('SELECT * FROM follow_ups WHERE id = ?', [followUpId])
  return rows[0]
}

export async function cancelFollowUp(followUpId, actor) {
  const followUp = await requireFollowUpAccess(followUpId, actor)
  if (followUp.status !== 'PENDING') {
    throw new ApiError(409, 'Only pending follow-ups can be cancelled')
  }

  await cancelFollowUpModel(followUpId)
  await recomputeLeadFollowUpDate(followUp.lead_id)
  await createActivity({
    leadId: followUp.lead_id,
    actorId: actor.userId,
    activityType: 'FOLLOWUP_CANCELLED',
    description: 'Follow-up cancelled',
    metadata: { followUpId },
  })

  const [rows] = await pool.query('SELECT * FROM follow_ups WHERE id = ?', [followUpId])
  return rows[0]
}

export async function listFollowUpsForLead(leadId, actor) {
  await requireLeadAccess(leadId, actor)
  return listFollowUpsByLead(leadId)
}

export async function listFollowUps(filters, actor) {
  if (actor.isAdmin) {
    return listFollowUpsAdmin(filters)
  }
  return listFollowUpsForFreelancer({ ...filters, freelancerId: actor.freelancerProfileId })
}
