import { findCertificateByNumber } from '../models/certificateModel.js'
import { findProfileById } from '../models/freelancerProfileModel.js'

export async function verifyCertificate(certificateNumber) {
  const certificate = await findCertificateByNumber(certificateNumber)
  if (!certificate) {
    return { verified: false, status: 'NOT_FOUND' }
  }

  if (certificate.status === 'REVOKED') {
    return { verified: false, status: 'REVOKED', certificateNumber: certificate.certificate_number }
  }

  const profile = await findProfileById(certificate.freelancer_id)

  return {
    verified: true,
    status: 'ACTIVE',
    certificateNumber: certificate.certificate_number,
    freelancerName: profile?.full_name ?? null,
    partnerId: profile?.partner_id ?? null,
    title: certificate.title,
    issuedAt: certificate.issued_at,
  }
}
