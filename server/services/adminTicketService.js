import path from 'node:path'
import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { findProfileById } from '../models/freelancerProfileModel.js'
import { findUserById, listAdminUsers } from '../models/userModel.js'
import {
  findTicketByIdForUpdate,
  findTicketDetailById,
  updateTicketAssignment,
  updateTicketPriority,
  updateTicketStatus,
  listTicketsAdmin,
  listMessagesByTicket,
  createTicketMessage,
  createTicketAttachment,
  listAttachmentsByTicket,
  findAttachmentById,
  getUnassignedOpenCount,
  getHighPriorityOpenCount,
} from '../models/ticketModel.js'
import { assertValidTicketStatusTransition, timestampsForStatus } from './ticketStatusService.js'
import { logAudit } from './auditService.js'
import { notify } from './notificationService.js'

function toRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/')
}

export async function listTickets(query) {
  const { rows, total } = await listTicketsAdmin(query)
  return { rows, total, page: query.page, limit: query.limit }
}

export async function getTicketDetail(id) {
  const ticket = await findTicketDetailById(id)
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found')
  }
  const [messages, attachments] = await Promise.all([listMessagesByTicket(id), listAttachmentsByTicket(id)])
  return { ticket, messages, attachments }
}

export async function listAssignableAdmins() {
  return listAdminUsers()
}

export async function getDashboardCounts() {
  const [unassigned, highPriority] = await Promise.all([getUnassignedOpenCount(), getHighPriorityOpenCount()])
  return { unassignedOpen: unassigned, highPriorityOpen: highPriority }
}

async function requireAdminUser(adminId) {
  const user = await findUserById(adminId)
  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new ApiError(422, 'Ticket can only be assigned to an admin user')
  }
  return user
}

export async function assignTicket(id, targetAdminId, actorId, req) {
  const targetAdmin = await requireAdminUser(targetAdminId)

  const connection = await pool.getConnection()
  let ticket
  try {
    await connection.beginTransaction()
    ticket = await findTicketByIdForUpdate(id, connection)
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found')
    }
    await updateTicketAssignment(id, targetAdminId, connection)
    // A fresh OPEN ticket becomes ASSIGNED the moment someone takes
    // ownership of it — that's the whole meaning of the status. A ticket
    // already further along (IN_PROGRESS, WAITING_FOR_FREELANCER, ...) keeps
    // its current status on reassignment; only OPEN advances.
    if (ticket.status === 'OPEN') {
      await updateTicketStatus(id, { status: 'ASSIGNED' }, connection)
    }
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  const isReassignment = Boolean(ticket.assigned_admin_id)
  await logAudit({
    actorId,
    action: isReassignment ? 'TICKET_REASSIGNED' : 'TICKET_ASSIGNED',
    entity: 'ticket',
    entityId: id,
    oldValue: { assignedAdminId: ticket.assigned_admin_id },
    newValue: { assignedAdminId: targetAdminId },
    req,
  })

  const freelancerProfile = await findProfileById(ticket.freelancer_id)
  notify({
    recipientUserId: freelancerProfile.user_id,
    type: 'TICKET_ASSIGNED',
    title: 'Your ticket was assigned',
    message: `${ticket.ticket_number} (${ticket.subject}) is now being handled by ${targetAdmin.email}.`,
    relatedEntityType: 'ticket',
    relatedEntityId: id,
  }).catch((error) => console.error('[adminTicketService] Failed to notify freelancer of assignment:', error.message))

  return findTicketDetailById(id)
}

export async function changePriority(id, priority, actorId, req) {
  const ticket = await findTicketDetailById(id)
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found')
  }
  await updateTicketPriority(id, priority)

  await logAudit({
    actorId,
    action: 'TICKET_PRIORITY_CHANGED',
    entity: 'ticket',
    entityId: id,
    oldValue: { priority: ticket.priority },
    newValue: { priority },
    req,
  })

  return findTicketDetailById(id)
}

export async function changeStatus(id, status, actorId, req) {
  const connection = await pool.getConnection()
  let ticket
  try {
    await connection.beginTransaction()
    ticket = await findTicketByIdForUpdate(id, connection)
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found')
    }
    assertValidTicketStatusTransition(ticket.status, status)
    await updateTicketStatus(id, { status, ...timestampsForStatus(status) }, connection)
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await logAudit({
    actorId,
    action: 'TICKET_STATUS_CHANGED',
    entity: 'ticket',
    entityId: id,
    oldValue: { status: ticket.status },
    newValue: { status },
    req,
  })

  const freelancerProfile = await findProfileById(ticket.freelancer_id)
  notify({
    recipientUserId: freelancerProfile.user_id,
    type: 'TICKET_STATUS_CHANGED',
    title: 'Your ticket status changed',
    message: `${ticket.ticket_number} (${ticket.subject}) is now ${status}.`,
    relatedEntityType: 'ticket',
    relatedEntityId: id,
  }).catch((error) => console.error('[adminTicketService] Failed to notify freelancer of status change:', error.message))

  return findTicketDetailById(id)
}

export async function replyToTicket(id, actorId, { message }, file, req) {
  const ticket = await findTicketDetailById(id)
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found')
  }
  if (ticket.status === 'CLOSED') {
    throw new ApiError(409, 'This ticket is closed. Reopen it before replying.')
  }

  const connection = await pool.getConnection()
  let messageId
  try {
    await connection.beginTransaction()
    messageId = await createTicketMessage({ ticketId: id, senderUserId: actorId, senderRole: 'ADMIN', message }, connection)
    // An admin's first response naturally moves a fresh ticket into active
    // work — matches common help-desk behavior and keeps the status
    // meaningful without requiring a separate manual click every time.
    if (['OPEN', 'ASSIGNED'].includes(ticket.status)) {
      await updateTicketStatus(id, { status: 'IN_PROGRESS' }, connection)
    }
    if (file) {
      await createTicketAttachment(
        {
          ticketId: id,
          messageId,
          uploadedBy: actorId,
          originalFilename: file.originalname,
          filePath: toRelativePath(file.path),
          mimeType: file.mimetype,
          fileSize: file.size,
        },
        connection
      )
    }
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await logAudit({ actorId, action: 'TICKET_REPLIED', entity: 'ticket', entityId: id, req })

  const freelancerProfile = await findProfileById(ticket.freelancer_id)
  notify({
    recipientUserId: freelancerProfile.user_id,
    type: 'TICKET_REPLIED',
    title: 'Admin replied to your ticket',
    message: `You have a new reply on ${ticket.ticket_number}: ${ticket.subject}`,
    relatedEntityType: 'ticket',
    relatedEntityId: id,
    emailSubject: 'New reply on your support ticket',
    emailHtml: `<p>You have a new reply on ${ticket.ticket_number} — ${ticket.subject}.</p>`,
  }).catch((error) => console.error('[adminTicketService] Failed to notify freelancer of reply:', error.message))

  return findTicketDetailById(id)
}

export async function getAttachment(ticketId, attachmentId) {
  const ticket = await findTicketDetailById(ticketId)
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found')
  }
  const attachment = await findAttachmentById(attachmentId)
  if (!attachment || attachment.ticket_id !== Number(ticketId)) {
    throw new ApiError(404, 'Attachment not found')
  }
  return attachment
}
