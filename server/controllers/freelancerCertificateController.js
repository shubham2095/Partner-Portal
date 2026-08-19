import path from 'node:path'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import * as freelancerCertificateService from '../services/freelancerCertificateService.js'

export const listMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await freelancerCertificateService.listMyCertificates(req.user.id)
  sendSuccess(res, { message: 'Your certificates retrieved', data: { certificates } })
})

export const getMyCertificateDetail = asyncHandler(async (req, res) => {
  const certificate = await freelancerCertificateService.getMyCertificateDetail(
    Number(req.params.id),
    req.user.id
  )
  sendSuccess(res, { message: 'Certificate detail retrieved', data: { certificate } })
})

export const downloadMyCertificate = asyncHandler(async (req, res) => {
  const certificate = await freelancerCertificateService.getMyCertificateDetail(
    Number(req.params.id),
    req.user.id
  )
  if (!certificate.pdf_path) {
    throw new ApiError(404, 'Certificate PDF is not available')
  }
  const absolutePath = path.join(process.cwd(), certificate.pdf_path)
  res.download(absolutePath, `${certificate.certificate_number}.pdf`)
})
