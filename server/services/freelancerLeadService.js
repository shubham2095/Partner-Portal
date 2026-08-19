import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import { findLeadDetailById, findLeadByIdForUpdate, updateLeadStatus, listLeadsForFreelancer } from '../models/leadModel.js'
import { createActivity, listActivitiesByLead } from '../models/leadActivityModel.js'
import { listAssignmentsByLead } from '../models/leadAssignmentModel.js'
import { assertValidStatusTransition, activityTypeForStatus } from './leadStatusService.js'
import { logAudit } from './auditService.js'

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
