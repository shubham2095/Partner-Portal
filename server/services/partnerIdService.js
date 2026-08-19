const PARTNER_ID_PREFIX = 'HTG-FR-'
const PARTNER_ID_PADDING = 6

export function generatePartnerId(profileId) {
  return `${PARTNER_ID_PREFIX}${String(profileId).padStart(PARTNER_ID_PADDING, '0')}`
}
