import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pool } from '../config/database.js'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import {
  createCertificate as createCertificateModel,
  setCertificateNumber,
  findCertificateById,
  findCertificateByFreelancerAndTest,
  updateCertificatePdfPath,
} from '../models/certificateModel.js'
import { findProfileById } from '../models/freelancerProfileModel.js'
import { findUserById } from '../models/userModel.js'
import { generateCertificateNumber } from './certificateNumberService.js'
import { renderCertificatePdf } from './certificatePdfService.js'
import { sendCertificateGeneratedEmail } from './emailService.js'
import { logAudit } from './auditService.js'

async function renderAndStorePdf(certificate, profile, title) {
  const verifyUrl = `${env.certificate.verifyBaseUrl}/${certificate.certificate_number}`
  const pdfBuffer = await renderCertificatePdf({
    certificateNumber: certificate.certificate_number,
    freelancerName: profile.full_name,
    partnerId: profile.partner_id,
    title,
    issuedAt: certificate.issued_at,
    verifyUrl,
  })

  const certificatesDir = path.join(process.cwd(), env.upload.dir, 'certificates')
  fs.mkdirSync(certificatesDir, { recursive: true })
  const filePath = path.join(certificatesDir, `${certificate.certificate_number}.pdf`)
  fs.writeFileSync(filePath, pdfBuffer)
  const relativePath = path.relative(process.cwd(), filePath).split(path.sep).join('/')
  await updateCertificatePdfPath(certificate.id, relativePath)
  return relativePath
}

export async function generateCertificateForAttempt(
  { freelancerId, testAttemptId, testId, webinarId, title },
  req
) {
  const existing = await findCertificateByFreelancerAndTest(freelancerId, testId)
  if (existing && existing.status === 'ACTIVE') {
    return existing
  }

  const profile = await findProfileById(freelancerId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }

  const connection = await pool.getConnection()
  let certificateId
  try {
    await connection.beginTransaction()
    const placeholder = `TMP-${crypto.randomUUID()}`
    certificateId = await createCertificateModel(
      { certificateNumber: placeholder, freelancerId, testAttemptId, testId, webinarId, title, pdfPath: null },
      connection
    )
    const certificateNumber = generateCertificateNumber(certificateId)
    await setCertificateNumber(certificateId, certificateNumber, connection)
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  const certificate = await findCertificateById(certificateId)
  await renderAndStorePdf(certificate, profile, title)

  await logAudit({
    actorId: null,
    action: 'CERTIFICATE_GENERATED',
    entity: 'certificate',
    entityId: certificateId,
    newValue: { certificateNumber: certificate.certificate_number, freelancerId, testId },
    req,
  })

  try {
    const user = await findUserById(profile.user_id)
    if (user) {
      await sendCertificateGeneratedEmail(user.email, {
        certificateNumber: certificate.certificate_number,
        title,
      })
    }
  } catch (error) {
    console.error('[emailService] Failed to send certificate generated email', error)
  }

  return findCertificateById(certificateId)
}

export async function regenerateCertificatePdf(certificateId, adminId, req) {
  const certificate = await findCertificateById(certificateId)
  if (!certificate) {
    throw new ApiError(404, 'Certificate not found')
  }
  if (certificate.status !== 'ACTIVE') {
    throw new ApiError(422, 'Only active certificates can be regenerated')
  }

  const profile = await findProfileById(certificate.freelancer_id)
  await renderAndStorePdf(certificate, profile, certificate.title)

  await logAudit({
    actorId: adminId,
    action: 'CERTIFICATE_REGENERATED',
    entity: 'certificate',
    entityId: certificateId,
    req,
  })

  return findCertificateById(certificateId)
}
