import path from 'node:path'
import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import {
  createTicket as createTicketModel,
  setTicketNumber,
  formatTicketNumber,
  findTicketDetailById,
  listTicketsForFreelancer,
  getTicketCountsByStatus,
  createTicketMessage,
  listMessagesByTicket,
  createTicketAttachment,
  listAttachmentsByTicket,
  findAttachmentById,
  updateTicketStatus as updateTicketStatusModel,
} from '../models/ticketModel.js'
import { logAudit } from './auditService.js'
import { notifyAdmins, notify } from './notificationService.js'

async function requireProfile(userId) {
  const profile = await findProfileByUserId(userId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }
  return profile
}

async function requireOwnTicket(id, freelancerProfileId) {
  const ticket = await findTicketDetailById(id)
  if (!ticket || ticket.freelancer_id !== freelancerProfileId) {
    throw new ApiError(404, 'Ticket not found')
  }
  return ticket
}

function toRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/')
}

export async function createMyTicket(payload, userId, file, req) {
  const profile = await requireProfile(userId)

  const connection = await pool.getConnection()
  let ticketId
  try {
    await connection.beginTransaction()
    ticketId = await createTicketModel(
      { freelancerId: profile.id, category: payload.category, subject: payload.subject, description: payload.description, priority: payload.priority },
      connection
    )
    await setTicketNumber(ticketId, formatTicketNumber(ticketId), connection)
    if (file) {
      await createTicketAttachment(
        {
          ticketId,
          messageId: null,
          uploadedBy: userId,
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

  await logAudit({
    actorId: userId,
    action: 'TICKET_CREATED',
    entity: 'ticket',
    entityId: ticketId,
    newValue: { category: payload.category, subject: payload.subject, priority: payload.priority ?? 'MEDIUM' },
    req,
  })

  notifyAdmins({
    type: 'TICKET_CREATED',
    title: 'New support ticket',
    message: `${profile.full_name} raised a ${payload.category} ticket: ${payload.subject}`,
    relatedEntityType: 'ticket',
    relatedEntityId: ticketId,
  }).catch((error) => console.error('[freelancerTicketService] Failed to notify admins of new ticket:', error.message))

  return findTicketDetailById(ticketId)
}

export async function listMyTickets(userId, query) {
  const profile = await requireProfile(userId)
  const { rows, total } = await listTicketsForFreelancer({ ...query, freelancerId: profile.id })
  return { rows, total, page: query.page, limit: query.limit }
}

export async function getMyTicketDetail(id, userId) {
  const profile = await requireProfile(userId)
  const ticket = await requireOwnTicket(id, profile.id)
  const [messages, attachments] = await Promise.all([listMessagesByTicket(id), listAttachmentsByTicket(id)])
  return { ticket, messages, attachments }
}

export async function getMyTicketCounts(userId) {
  const profile = await requireProfile(userId)
  const rows = await getTicketCountsByStatus(profile.id)
  const byStatus = new Map(rows.map((row) => [row.status, row.count]))
  return {
    open: (byStatus.get('OPEN') ?? 0) + (byStatus.get('IN_PROGRESS') ?? 0),
    resolved: byStatus.get('RESOLVED') ?? 0,
    closed: byStatus.get('CLOSED') ?? 0,
  }
}

export async function replyToMyTicket(id, userId, { message }, file, req) {
  const profile = await requireProfile(userId)
  const ticket = await requireOwnTicket(id, profile.id)

  if (ticket.status === 'CLOSED') {
    throw new ApiError(409, 'This ticket is closed. Ask an admin to reopen it before replying.')
  }

  const connection = await pool.getConnection()
  let messageId
  try {
    await connection.beginTransaction()
    messageId = await createTicketMessage({ ticketId: id, senderUserId: userId, senderRole: 'FREELANCER', message }, connection)
    // Replying is exactly what clears WAITING_FOR_FREELANCER — the state's
    // own name is the condition for leaving it, so this is automatic rather
    // than requiring the freelancer to also flip a status control they don't
    // have access to.
    if (ticket.status === 'WAITING_FOR_FREELANCER') {
      await updateTicketStatusModel(id, { status: 'IN_PROGRESS' }, connection)
    }
    if (file) {
      await createTicketAttachment(
        {
          ticketId: id,
          messageId,
          uploadedBy: userId,
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

  await logAudit({ actorId: userId, action: 'TICKET_REPLIED', entity: 'ticket', entityId: id, req })

  if (ticket.assigned_admin_id) {
    notify({
      recipientUserId: ticket.assigned_admin_id,
      type: 'TICKET_REPLIED',
      title: 'Freelancer replied to a ticket',
      message: `${profile.full_name} replied on ${ticket.ticket_number}: ${ticket.subject}`,
      relatedEntityType: 'ticket',
      relatedEntityId: id,
    }).catch((error) => console.error('[freelancerTicketService] Failed to notify admin of reply:', error.message))
  } else {
    notifyAdmins({
      type: 'TICKET_REPLIED',
      title: 'Freelancer replied to an unassigned ticket',
      message: `${profile.full_name} replied on ${ticket.ticket_number}: ${ticket.subject}`,
      relatedEntityType: 'ticket',
      relatedEntityId: id,
    }).catch((error) => console.error('[freelancerTicketService] Failed to notify admins of reply:', error.message))
  }

  return findTicketDetailById(id)
}

export async function getMyAttachment(ticketId, attachmentId, userId) {
  const profile = await requireProfile(userId)
  await requireOwnTicket(ticketId, profile.id)
  const attachment = await findAttachmentById(attachmentId)
  if (!attachment || attachment.ticket_id !== Number(ticketId)) {
    throw new ApiError(404, 'Attachment not found')
  }
  return attachment
}
