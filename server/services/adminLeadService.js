import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import {
  createLead as createLeadModel,
  setLeadNumber,
  findLeadById,
  findLeadDetailById,
  findLeadByIdForUpdate,
  findDuplicateLeadCandidates,
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
import { notify, notifyAdmins } from './notificationService.js'
import * as followUpService from './followUpService.js'
import { normalizePhoneDigits, normalizeEmail, withDuplicateCheckLock } from '../utils/leadDuplicateCheck.js'

// Admin already has full visibility into every lead, so a duplicate match
// can safely surface the same safe reference fields the admin leads list
// already exposes — no new information is leaked by this response.
function toDuplicateConflict(candidates) {
  return {
    duplicate: true,
    message: 'A lead with a matching phone number or email already exists.',
    matches: candidates.map((row) => ({
      id: row.id,
      leadNumber: row.lead_number,
      clientName: row.client_name,
      company: row.company,
      status: row.status,
      assignedFreelancerId: row.assigned_freelancer_id,
    })),
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

async function requireLead(id, executor = pool) {
  const lead = await findLeadById(id, executor)
  if (!lead) {
    throw new ApiError(404, 'Lead not found')
  }
  return lead
}

export async function createLead(payload, adminId, req) {
  const normalizedPhoneDigits = normalizePhoneDigits(payload.mobile)
  const normalizedEmail = normalizeEmail(payload.email)

  // Optimistic pre-check outside the transaction — gives a fast, friendly
  // 409 for the common (non-concurrent) case without holding any lock.
  const precheckCandidates = await findDuplicateLeadCandidates({ normalizedPhoneDigits, normalizedEmail })
  if (precheckCandidates.length > 0) {
    throw new ApiError(409, 'Possible duplicate lead detected', toDuplicateConflict(precheckCandidates))
  }

  const connection = await pool.getConnection()
  let leadId
  try {
    // Authoritative re-check, serialized against any other concurrent
    // check-then-insert for the same normalized values — see
    // withDuplicateCheckLock in leadDuplicateCheck.js for why this uses a
    // MySQL named lock rather than a locking SELECT (no UNIQUE constraint
    // exists on mobile/email; see migration 0046).
    await withDuplicateCheckLock(connection, { normalizedPhoneDigits, normalizedEmail }, async () => {
      await connection.beginTransaction()
      try {
        const lockedCandidates = await findDuplicateLeadCandidates({ normalizedPhoneDigits, normalizedEmail }, connection)
        if (lockedCandidates.length > 0) {
          throw new ApiError(409, 'Possible duplicate lead detected', toDuplicateConflict(lockedCandidates))
        }

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
      }
    })
  } finally {
    connection.release()
  }

  await logAudit({ actorId: adminId, action: 'LEAD_CREATED', entity: 'lead', entityId: leadId, newValue: payload, req })

  if (payload.nextFollowUpDate) {
    // Reuses the existing follow-up system end-to-end (ownership rules,
    // activity timeline, reminder scheduling) rather than duplicating it.
    await followUpService
      .createFollowUp(
        leadId,
        { scheduledAt: payload.nextFollowUpDate, followUpType: payload.followUpType ?? 'PHONE_CALL' },
        { isAdmin: true, userId: adminId }
      )
      .catch((error) => console.error('[adminLeadService] Failed to create initial follow-up:', error.message))
  }

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

  if (status === 'CONVERTED') {
    // Best-effort: a notification failure must never fail the underlying
    // status change that already committed.
    notifyAdmins({
      type: 'LEAD_CONVERTED',
      title: 'Lead converted',
      message: `Lead #${id} was marked converted${conversionValue ? ` (₹${conversionValue})` : ''}.`,
      relatedEntityType: 'lead',
      relatedEntityId: id,
    }).catch((error) => console.error('[adminLeadService] Failed to notify admins of conversion:', error.message))
  }

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

  if (freelancerId) {
    const profile = await findProfileById(freelancerId)
    const lead = await findLeadById(id)
    notify({
      recipientUserId: profile.user_id,
      type: 'LEAD_ASSIGNED',
      title: 'New lead assigned to you',
      message: `${lead.client_name} (${lead.lead_number}) has been assigned to you.`,
      relatedEntityType: 'lead',
      relatedEntityId: id,
      emailSubject: 'New lead assigned to you',
      emailHtml: `<p>A lead <strong>${lead.client_name}</strong> (${lead.lead_number}) has been assigned to you.</p>`,
    }).catch((error) => console.error('[adminLeadService] Failed to notify freelancer of assignment:', error.message))
  }

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
