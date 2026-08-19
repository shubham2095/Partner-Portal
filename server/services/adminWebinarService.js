import { ApiError } from '../utils/ApiError.js'
import {
  createWebinar as createWebinarModel,
  findWebinarById,
  updateWebinar as updateWebinarModel,
  updateWebinarStatus,
  listWebinars,
} from '../models/webinarModel.js'
import {
  listRegistrationsByWebinar,
  getRegistrationStats,
  findRegistrationById,
  updateRegistrationStatus,
} from '../models/webinarRegistrationModel.js'
import { upsertAttendance, findAttendanceByRegistrationId } from '../models/webinarAttendanceModel.js'
import { logAudit } from './auditService.js'

const WEBINAR_STATUSES = ['DRAFT', 'PUBLISHED', 'LIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED']
const ATTENDANCE_STATUSES = ['REGISTERED', 'ATTENDED', 'ABSENT']

async function requireWebinar(id) {
  const webinar = await findWebinarById(id)
  if (!webinar) {
    throw new ApiError(404, 'Webinar not found')
  }
  return webinar
}

async function requireRegistration(id) {
  const registration = await findRegistrationById(id)
  if (!registration) {
    throw new ApiError(404, 'Registration not found')
  }
  return registration
}

export async function listWebinarsAdmin({ status, search, page, limit }) {
  const { rows, total } = await listWebinars({ status, search, page, limit })
  return { rows, total, page, limit }
}

export async function createWebinar(payload, adminId, req) {
  const id = await createWebinarModel({ ...payload, createdBy: adminId })
  await logAudit({
    actorId: adminId,
    action: 'WEBINAR_CREATED',
    entity: 'webinar',
    entityId: id,
    newValue: { title: payload.title, status: 'DRAFT' },
    req,
  })
  return findWebinarById(id)
}

export async function getWebinarDetail(id) {
  const webinar = await requireWebinar(id)
  const stats = await getRegistrationStats(id)
  const registrationStats = {
    REGISTERED: 0,
    ATTENDED: 0,
    ABSENT: 0,
    CANCELLED: 0,
    total: 0,
  }
  for (const row of stats) {
    registrationStats[row.status] = row.count
    registrationStats.total += row.count
  }
  return { webinar, registrationStats }
}

export async function updateWebinar(id, fields, adminId, req) {
  const webinar = await requireWebinar(id)
  await updateWebinarModel(id, fields)
  await logAudit({
    actorId: adminId,
    action: 'WEBINAR_UPDATED',
    entity: 'webinar',
    entityId: id,
    oldValue: webinar,
    newValue: fields,
    req,
  })
  return findWebinarById(id)
}

export async function changeWebinarStatus(id, status, adminId, req) {
  if (!WEBINAR_STATUSES.includes(status)) {
    throw new ApiError(422, 'Invalid webinar status')
  }
  const webinar = await requireWebinar(id)
  await updateWebinarStatus(id, status)
  await logAudit({
    actorId: adminId,
    action: 'WEBINAR_STATUS_CHANGED',
    entity: 'webinar',
    entityId: id,
    oldValue: { status: webinar.status },
    newValue: { status },
    req,
  })
  return findWebinarById(id)
}

export async function listWebinarRegistrations(webinarId, { status, search, page, limit }) {
  await requireWebinar(webinarId)
  const { rows, total } = await listRegistrationsByWebinar({ webinarId, status, search, page, limit })
  return { rows, total, page, limit }
}

export async function markAttendance(registrationId, { attendanceStatus, joinTime, leaveTime, notes }, adminId, req) {
  if (!ATTENDANCE_STATUSES.includes(attendanceStatus)) {
    throw new ApiError(422, 'Invalid attendance status')
  }
  const registration = await requireRegistration(registrationId)

  await upsertAttendance({
    registrationId,
    attendanceStatus,
    markedBy: adminId,
    markedAt: new Date(),
    joinTime: joinTime ?? null,
    leaveTime: leaveTime ?? null,
    notes: notes ?? null,
  })

  await updateRegistrationStatus(registrationId, attendanceStatus)

  await logAudit({
    actorId: adminId,
    action: 'WEBINAR_ATTENDANCE_UPDATED',
    entity: 'webinar_registration',
    entityId: registrationId,
    oldValue: { status: registration.status },
    newValue: { attendanceStatus },
    req,
  })

  return findAttendanceByRegistrationId(registrationId)
}
