import { pool } from '../config/database.js'
import {
  createExternalLead,
  findLeadByExternalId,
  setLeadNumber,
  updateLeadAssignment,
  findLeadById,
} from '../models/leadModel.js'
import { createAssignment } from '../models/leadAssignmentModel.js'
import { createActivity } from '../models/leadActivityModel.js'
import { generateLeadNumber } from './leadNumberService.js'
import { isProviderEnabled } from '../models/integrationConfigModel.js'
import { pickNextFreelancer } from './roundRobinAssignmentService.js'
import { notify, notifyAdmins } from './notificationService.js'
import { findProfileById } from '../models/freelancerProfileModel.js'

/**
 * Creates a lead in the existing Phase 4 CRM from a normalized external
 * payload. Idempotent: a duplicate (source, externalId) returns the
 * existing lead untouched rather than creating a second record.
 *
 * External leads always land in the normal NEW/unassigned lifecycle —
 * this never marks a lead converted or commission-eligible.
 */
export async function createLeadFromExternalSource({
  source,
  externalId,
  clientName,
  mobile,
  email,
  serviceInterested,
  businessCategory,
}) {
  const existing = await findLeadByExternalId(source, externalId)
  if (existing) {
    return { lead: existing, created: false }
  }

  if (!mobile) {
    // Existing lead validation requires a mobile number; a payload without
    // one cannot become a valid CRM lead. Caller records this as a failure.
    throw new Error('External lead payload missing a contact number')
  }

  const connection = await pool.getConnection()
  let leadId

  try {
    await connection.beginTransaction()
    leadId = await createExternalLead(
      {
        clientName: clientName || 'Unknown',
        mobile,
        email,
        serviceInterested,
        businessCategory,
        externalSource: source,
        externalId,
      },
      connection
    )
    await setLeadNumber(leadId, generateLeadNumber(leadId), connection)
    await createActivity(
      {
        leadId,
        actorId: null,
        activityType: 'LEAD_CREATED',
        description: `Lead received from ${source}`,
        metadata: { externalSource: source, externalId },
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

  const lead = await findLeadById(leadId)
  await maybeAutoAssign(lead)

  return { lead: await findLeadById(leadId), created: true }
}

async function maybeAutoAssign(lead) {
  const autoAssignEnabled = await isProviderEnabled('AUTO_ASSIGNMENT')
  if (!autoAssignEnabled) {
    await notifyAdmins({
      type: 'LEAD_ASSIGNED',
      title: 'New unassigned lead',
      message: `Lead ${lead.lead_number} (${lead.client_name}) arrived from ${lead.external_source} and needs manual assignment.`,
      relatedEntityType: 'lead',
      relatedEntityId: lead.id,
    })
    return
  }

  const freelancerId = await pickNextFreelancer()
  if (!freelancerId) {
    await notifyAdmins({
      type: 'LEAD_ASSIGNED',
      title: 'New lead — no eligible freelancer',
      message: `Lead ${lead.lead_number} (${lead.client_name}) arrived from ${lead.external_source} but no ACTIVE freelancer is available for auto-assignment.`,
      relatedEntityType: 'lead',
      relatedEntityId: lead.id,
    })
    return
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await updateLeadAssignment(lead.id, freelancerId, connection)
    await createAssignment(
      {
        leadId: lead.id,
        freelancerId,
        previousFreelancerId: null,
        assignedBy: null,
        assignmentNote: `Auto-assigned (round-robin) from ${lead.external_source} integration`,
      },
      connection
    )
    await createActivity(
      {
        leadId: lead.id,
        actorId: null,
        activityType: 'ASSIGNED',
        description: 'Auto-assigned via round-robin distribution',
        metadata: { freelancerId, strategy: 'round_robin' },
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

  const profile = await findProfileById(freelancerId)
  await notify({
    recipientUserId: profile.user_id,
    type: 'LEAD_ASSIGNED',
    title: 'New lead assigned to you',
    message: `${lead.client_name} (${lead.lead_number}) has been assigned to you.`,
    relatedEntityType: 'lead',
    relatedEntityId: lead.id,
    emailSubject: 'New lead assigned to you',
    emailHtml: `<p>A new lead <strong>${lead.client_name}</strong> (${lead.lead_number}) has been assigned to you.</p>`,
  })
}
