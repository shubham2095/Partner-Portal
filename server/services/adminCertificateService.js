import { ApiError } from '../utils/ApiError.js'
import {
  findCertificateById,
  listCertificates,
  updateCertificateStatus,
} from '../models/certificateModel.js'
import { regenerateCertificatePdf as regeneratePdf } from './certificateService.js'
import { logAudit } from './auditService.js'

async function requireCertificate(id) {
  const certificate = await findCertificateById(id)
  if (!certificate) {
    throw new ApiError(404, 'Certificate not found')
  }
  return certificate
}

export async function listCertificatesAdmin({ status, search, freelancerId, page, limit }) {
  const { rows, total } = await listCertificates({ status, search, freelancerId, page, limit })
  return { rows, total, page, limit }
}

export async function getCertificateDetail(id) {
  return requireCertificate(id)
}

export async function regenerateCertificatePdf(id, adminId, req) {
  return regeneratePdf(id, adminId, req)
}

export async function revokeCertificate(id, reason, adminId, req) {
  const certificate = await requireCertificate(id)
  if (certificate.status === 'REVOKED') {
    throw new ApiError(409, 'Certificate is already revoked')
  }

  await updateCertificateStatus(id, {
    status: 'REVOKED',
    revokedAt: new Date(),
    revokedBy: adminId,
    revokeReason: reason,
  })

  await logAudit({
    actorId: adminId,
    action: 'CERTIFICATE_REVOKED',
    entity: 'certificate',
    entityId: id,
    oldValue: { status: certificate.status },
    newValue: { status: 'REVOKED', reason },
    req,
  })

  return findCertificateById(id)
}
