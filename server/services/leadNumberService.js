const LEAD_PREFIX = 'LEAD-'
const LEAD_PADDING = 6

export function generateLeadNumber(leadId) {
  return `${LEAD_PREFIX}${String(leadId).padStart(LEAD_PADDING, '0')}`
}
