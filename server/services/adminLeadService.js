import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import {
  createLead as createLeadModel,
  setLeadNumber,
  findLeadById,
  findLeadDetailById,
  findLeadByIdForUpdate,
  updateLead as updateLeadModel,
  updateLeadStatus,
  updateLeadAssignment,
  listLeadsAdmin,
} from '../models/leadModel.js'
import { createAssignment, listAssignmentsByLead } from '../models/leadAssignmentModel.js'
import { createActivity, listActivitiesByLead } from '../models/leadActivityModel.js'
import { findProfileById } from '../models/freelancerProfileModel.js'
import { generateLeadNumber } from './leadNumberService.js'
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

async function requireLead(id, executor = pool) {
  const lead = await findLeadById(id, executor)
  if (!lead) {
    throw new ApiError(404, 'Lead not found')
  }
  return lead
}

export async function createLead(payload, adminId, req) {
  const connection = await pool.getConnection()
  let leadId
  try {
    await connection.beginTransaction()
    leadId = await createLeadModel({ ...payload, createdBy: adminId }, connection)
    await setLeadNumber(leadId, generateLeadNumber(leadId), connection)
    await createActivity(
      { leadId, actorId: adminId, activityType: 'LEAD_CREATED', description: `Lead created: ${payload.clientName}` },
      connection
    )
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await logAudit({ actorId: adminId, action: 'LEAD_CREATED', entity: 'lead', entityId: leadId, newValue: payload, req })
  return findLeadDetailById(leadId)
}

export async function listLeads(query) {
  const { rows, total } = await listLeadsAdmin(query)
  return { rows, total, page: query.page, limit: query.limit }
}

export async function getLeadDetail(id) {
  const lead = await findLeadDetailById(id)
  if (!lead) {
    throw new ApiError(404, 'Lead not found')
  }
  return lead
}

export async function updateLead(id, fields, adminId, req) {
  const lead = await requireLead(id)
  await updateLeadModel(id, fields)
  await logAudit({ actorId: adminId, action: 'LEAD_UPDATED', entity: 'lead', entityId: id, oldValue: lead, newValue: fields, req })
  return findLeadDetailById(id)
}

export async function changeLeadStatus(id, { status, conversionValue }, adminId, req) {
  const connection = await pool.getConnection()
  let lead
  try {
    await connection.beginTransaction()
    lead = await findLeadByIdForUpdate(id, connection)
    if (!lead) {
      throw new ApiError(404, 'Lead not found')
    }
    assertValidStatusTransition(lead.status, status, true)

    await updateLeadStatus(id, { status, conversionValue }, connection)
    await createActivity(
      {
        leadId: id,
        actorId: adminId,
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
    actorId: adminId,
    action: 'LEAD_STATUS_CHANGED',
    entity: 'lead',
    entityId: id,
    oldValue: { status: lead.status },
    newValue: { status, conversionValue: conversionValue ?? null },
    req,
  })

  return findLeadDetailById(id)
}

export async function assignLead(id, freelancerId, note, adminId, req) {
  if (freelancerId) {
    const profile = await findProfileById(freelancerId)
    if (!profile) {
      throw new ApiError(404, 'Freelancer not found')
    }
  }

  const connection = await pool.getConnection()
  let previousFreelancerId
  try {
    await connection.beginTransaction()
    const lead = await findLeadByIdForUpdate(id, connection)
    if (!lead) {
      throw new ApiError(404, 'Lead not found')
    }
    previousFreelancerId = lead.assigned_freelancer_id

    await updateLeadAssignment(id, freelancerId ?? null, connection)
    await createAssignment(
      { leadId: id, freelancerId: freelancerId ?? null, previousFreelancerId, assignedBy: adminId, assignmentNote: note },
      connection
    )

    const activityType = !previousFreelancerId && freelancerId ? 'ASSIGNED' : !freelancerId ? 'UNASSIGNED' : 'REASSIGNED'
    await createActivity(
      {
        leadId: id,
        actorId: adminId,
        activityType,
        description:
          activityType === 'UNASSIGNED'
            ? 'Lead unassigned'
            : `Lead ${activityType === 'ASSIGNED' ? 'assigned' : 'reassigned'} to freelancer #${freelancerId}`,
        metadata: { freelancerId: freelancerId ?? null, previousFreelancerId, note: note ?? null },
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
    actorId: adminId,
    action: previousFreelancerId ? 'LEAD_REASSIGNED' : 'LEAD_ASSIGNED',
    entity: 'lead',
    entityId: id,
    oldValue: { freelancerId: previousFreelancerId },
    newValue: { freelancerId: freelancerId ?? null },
    req,
  })

  return findLeadDetailById(id)
}

export async function getLeadTimeline(id) {
  await requireLead(id)
  const [activities, assignments] = await Promise.all([listActivitiesByLead(id), listAssignmentsByLead(id)])
  return { activities, assignments }
}

export async function addActivity(id, { activityType, description }, adminId, req) {
  await requireLead(id)
  if (!ACTIVITY_TYPES.includes(activityType)) {
    throw new ApiError(422, 'Invalid activity type')
  }
  const activityId = await createActivity({ leadId: id, actorId: adminId, activityType, description })
  const [rows] = await pool.query('SELECT * FROM lead_activities WHERE id = ?', [activityId])
  return rows[0]
}
