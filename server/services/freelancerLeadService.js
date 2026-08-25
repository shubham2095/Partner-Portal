import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import {
  findLeadDetailById,
  findLeadByIdForUpdate,
  updateLeadStatus,
  listLeadsForFreelancer,
  createLead as createLeadModel,
  setLeadNumber,
  findDuplicateLeadCandidates,
} from '../models/leadModel.js'
import { createActivity, listActivitiesByLead } from '../models/leadActivityModel.js'
import { createAssignment, listAssignmentsByLead } from '../models/leadAssignmentModel.js'
import { generateLeadNumber } from './leadNumberService.js'
import { assertValidStatusTransition, activityTypeForStatus } from './leadStatusService.js'
import { logAudit } from './auditService.js'
import { notifyAdmins } from './notificationService.js'
import * as followUpService from './followUpService.js'
import { normalizePhoneDigits, normalizeEmail, withDuplicateCheckLock } from '../utils/leadDuplicateCheck.js'

// A freelancer must never learn anything about another freelancer's lead
// beyond "a possible duplicate exists" — no lead number, client name,
// status, or company, since even the status alone could leak a rival
// freelancer's deal progress. A match against the freelancer's OWN lead is
// safe to describe fully (it's already their data) so they can navigate to
// it instead of accidentally creating a second copy.
function toDuplicateConflict(candidates, ownFreelancerProfileId) {
  const ownMatches = candidates.filter((row) => row.assigned_freelancer_id === ownFreelancerProfileId)
  if (ownMatches.length > 0) {
    return {
      duplicate: true,
      message: 'You already have a lead with a matching phone number or email.',
      matches: ownMatches.map((row) => ({
        id: row.id,
        leadNumber: row.lead_number,
        clientName: row.client_name,
        company: row.company,
        status: row.status,
      })),
    }
  }
  return {
    duplicate: true,
    message: 'A similar lead may already exist in the CRM. Please check with your admin before proceeding.',
    matches: [],
  }
}

const ACTIVITY_TYPES = [
  'PHONE_CALL',
  'WHATSAPP',
  'EMAIL',
  'MEETING',
  'VIDEO_CALL',
  'SITE_VISIT',
  'NOTE_ADDED',
]

async function requireProfile(userId) {
  const profile = await findProfileByUserId(userId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }
  return profile
}

async function requireOwnLead(id, freelancerProfileId) {
  const lead = await findLeadDetailById(id)
  if (!lead || lead.assigned_freelancer_id !== freelancerProfileId) {
    throw new ApiError(404, 'Lead not found')
  }
  return lead
}

export async function resolveFreelancerProfileId(userId) {
  const profile = await requireProfile(userId)
  return profile.id
}

export async function createMyLead(payload, userId, req) {
  const profile = await requireProfile(userId)

  const normalizedPhoneDigits = normalizePhoneDigits(payload.mobile)
  const normalizedEmail = normalizeEmail(payload.email)

  const precheckCandidates = await findDuplicateLeadCandidates({ normalizedPhoneDigits, normalizedEmail })
  if (precheckCandidates.length > 0) {
    throw new ApiError(409, 'Possible duplicate lead detected', toDuplicateConflict(precheckCandidates, profile.id))
  }

  const connection = await pool.getConnection()
  let leadId
  try {
    await withDuplicateCheckLock(connection, { normalizedPhoneDigits, normalizedEmail }, async () => {
      await connection.beginTransaction()
      try {
        const lockedCandidates = await findDuplicateLeadCandidates({ normalizedPhoneDigits, normalizedEmail }, connection)
        if (lockedCandidates.length > 0) {
          throw new ApiError(409, 'Possible duplicate lead detected', toDuplicateConflict(lockedCandidates, profile.id))
        }

        // A freelancer-submitted lead is immediately linked to them — this is
        // the "lead must remain linked to the freelancer who submitted it"
        // requirement — using the exact same assignment mechanism (and history
        // trail) admin-driven assignment already uses, not a parallel path.
        leadId = await createLeadModel(
          { ...payload, createdBy: userId, assignedFreelancerId: profile.id },
          connection
        )
        await setLeadNumber(leadId, generateLeadNumber(leadId), connection)
        await createActivity(
          { leadId, actorId: userId, activityType: 'LEAD_CREATED', description: `Lead created: ${payload.clientName}` },
          connection
        )
        await createAssignment(
          { leadId, freelancerId: profile.id, previousFreelancerId: null, assignedBy: userId, assignmentNote: 'Self-submitted by freelancer' },
          connection
        )
        await createActivity(
          {
            leadId,
            actorId: userId,
            activityType: 'ASSIGNED',
            description: 'Lead self-assigned on creation',
            metadata: { freelancerId: profile.id },
          },
          connection
        )
        await connection.commit()
      } catch (error) {
        await connection.rollback()
        throw error
      }
    })
  } finally {
    connection.release()
  }

  await logAudit({ actorId: userId, action: 'LEAD_CREATED', entity: 'lead', entityId: leadId, newValue: payload, req })

  notifyAdmins({
    type: 'LEAD_ASSIGNED',
    title: 'New lead submitted by freelancer',
    message: `${profile.full_name} submitted a new lead: ${payload.clientName}.`,
    relatedEntityType: 'lead',
    relatedEntityId: leadId,
  }).catch((error) => console.error('[freelancerLeadService] Failed to notify admins of new lead:', error.message))

  if (payload.nextFollowUpDate) {
    await followUpService
      .createFollowUp(
        leadId,
        { scheduledAt: payload.nextFollowUpDate, followUpType: payload.followUpType ?? 'PHONE_CALL' },
        { isAdmin: false, userId, freelancerProfileId: profile.id }
      )
      .catch((error) => console.error('[freelancerLeadService] Failed to create initial follow-up:', error.message))
  }

  return findLeadDetailById(leadId)
}

export async function listMyLeads(userId, query) {
  const profile = await requireProfile(userId)
  const { rows, total } = await listLeadsForFreelancer({ ...query, freelancerId: profile.id })
  return { rows, total, page: query.page, limit: query.limit }
}

export async function getMyLeadDetail(id, userId) {
  const profile = await requireProfile(userId)
  return requireOwnLead(id, profile.id)
}

export async function changeMyLeadStatus(id, { status, conversionValue }, userId, req) {
  const profile = await requireProfile(userId)

  const connection = await pool.getConnection()
  let lead
  try {
    await connection.beginTransaction()
    lead = await findLeadByIdForUpdate(id, connection)
    if (!lead || lead.assigned_freelancer_id !== profile.id) {
      throw new ApiError(404, 'Lead not found')
    }
    assertValidStatusTransition(lead.status, status, false)

    await updateLeadStatus(id, { status, conversionValue }, connection)
    await createActivity(
      {
        leadId: id,
        actorId: userId,
        activityType: activityTypeForStatus(status),
        description: `Status changed from ${lead.status} to ${status}`,
        metadata: { from: lead.status, to: status, conversionValue: conversionValue ?? null },
      },
      connection
    )
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await logAudit({
    actorId: userId,
    action: 'LEAD_STATUS_CHANGED',
    entity: 'lead',
    entityId: id,
    oldValue: { status: lead.status },
    newValue: { status, conversionValue: conversionValue ?? null },
    req,
  })

  if (status === 'CONVERTED') {
    notifyAdmins({
      type: 'LEAD_CONVERTED',
      title: 'Lead converted',
      message: `Lead #${id} was marked converted${conversionValue ? ` (₹${conversionValue})` : ''}.`,
      relatedEntityType: 'lead',
      relatedEntityId: id,
    }).catch((error) => console.error('[freelancerLeadService] Failed to notify admins of conversion:', error.message))
  }

  return findLeadDetailById(id)
}

export async function getMyLeadTimeline(id, userId) {
  const profile = await requireProfile(userId)
  await requireOwnLead(id, profile.id)
  const [activities, assignments] = await Promise.all([listActivitiesByLead(id), listAssignmentsByLead(id)])
  return { activities, assignments }
}

export async function addMyActivity(id, { activityType, description }, userId) {
  const profile = await requireProfile(userId)
  await requireOwnLead(id, profile.id)
  if (!ACTIVITY_TYPES.includes(activityType)) {
    throw new ApiError(422, 'Invalid activity type')
  }
  const activityId = await createActivity({ leadId: id, actorId: userId, activityType, description })
  const [rows] = await pool.query('SELECT * FROM lead_activities WHERE id = ?', [activityId])
  return rows[0]
}
