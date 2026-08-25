import { ApiError } from '../utils/ApiError.js'

// PDF §22.12's required path is the backbone of this map:
//   OPEN -> ASSIGNED -> IN_PROGRESS -> WAITING_FOR_FREELANCER -> IN_PROGRESS
//         -> RESOLVED -> CLOSED
// A few additional transitions are kept for reasonable admin discretion
// (e.g. resolving directly from IN_PROGRESS without ever waiting on the
// freelancer, or jumping straight to CLOSED) — every one is still an
// explicit, server-validated entry in this map, never an arbitrary value.
// Reopening (CLOSED -> OPEN) is the one deliberately-added path back to the
// start, matching Part 5's existing reopen behavior.
const ALLOWED_TRANSITIONS = {
  OPEN: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  ASSIGNED: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['WAITING_FOR_FREELANCER', 'RESOLVED', 'CLOSED', 'OPEN'],
  WAITING_FOR_FREELANCER: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'OPEN', 'IN_PROGRESS'],
  CLOSED: ['OPEN'],
}

export function assertValidTicketStatusTransition(currentStatus, nextStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(409, `Ticket cannot move from ${currentStatus} to ${nextStatus}`)
  }
}

// resolvedAt/closedAt: undefined means "leave the existing value alone",
// null means "clear it", a Date means "set it now".
export function timestampsForStatus(nextStatus) {
  if (nextStatus === 'RESOLVED') return { resolvedAt: new Date(), closedAt: null }
  if (nextStatus === 'CLOSED') return { resolvedAt: undefined, closedAt: new Date() }
  // Moving back to OPEN or IN_PROGRESS clears both — the ticket is active again.
  return { resolvedAt: null, closedAt: null }
}
