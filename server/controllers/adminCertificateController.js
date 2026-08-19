import path from 'node:path'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import * as adminCertificateService from '../services/adminCertificateService.js'

export const listCertificates = asyncHandler(async (req, res) => {
  const { status, search, freelancerId, page = 1, limit = 20 } = req.query
  const result = await adminCertificateService.listCertificatesAdmin({
    status,
    search,
    freelancerId: freelancerId ? Number(freelancerId) : undefined,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Certificates retrieved',
    data: { certificates: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getCertificateDetail = asyncHandler(async (req, res) => {
  const certificate = await adminCertificateService.getCertificateDetail(Number(req.params.id))
  sendSuccess(res, { message: 'Certificate detail retrieved', data: { certificate } })
})

export const regenerateCertificatePdf = asyncHandler(async (req, res) => {
  const certificate = await adminCertificateService.regenerateCertificatePdf(
    Number(req.params.id),
    req.user.id,
    req
  )
  sendSuccess(res, { message: 'Certificate PDF regenerated', data: { certificate } })
})

export const revokeCertificate = asyncHandler(async (req, res) => {
  const certificate = await adminCertificateService.revokeCertificate(
    Number(req.params.id),
    req.body.reason,
    req.user.id,
    req
  )
  sendSuccess(res, { message: 'Certificate revoked', data: { certificate } })
})

export const downloadCertificate = asyncHandler(async (req, res) => {
  const certificate = await adminCertificateService.getCertificateDetail(Number(req.params.id))
  if (!certificate.pdf_path) {
    throw new ApiError(404, 'Certificate PDF is not available')
  }
  const absolutePath = path.join(process.cwd(), certificate.pdf_path)
  res.download(absolutePath, `${certificate.certificate_number}.pdf`)
})
