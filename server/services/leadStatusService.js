import { ApiError } from '../utils/ApiError.js'
import { LEAD_STATUSES, TERMINAL_STATUSES } from '../models/leadModel.js'

export function assertValidStatusTransition(currentStatus, nextStatus, isAdmin) {
  if (!LEAD_STATUSES.includes(nextStatus)) {
    throw new ApiError(422, 'Invalid lead status')
  }
  if (TERMINAL_STATUSES.has(currentStatus) && !isAdmin) {
    throw new ApiError(409, 'This lead is already closed and cannot be updated')
  }
}

export function activityTypeForStatus(status) {
  if (status === 'CONVERTED') return 'CONVERTED'
  if (status === 'LOST') return 'LOST'
  return 'STATUS_CHANGED'
}
