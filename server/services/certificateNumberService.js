const CERTIFICATE_PREFIX = 'CERT'
const CERTIFICATE_PADDING = 6

export function generateCertificateNumber(certificateId, year = new Date().getFullYear()) {
  return `${CERTIFICATE_PREFIX}-${year}-${String(certificateId).padStart(CERTIFICATE_PADDING, '0')}`
}
