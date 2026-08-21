import path from 'node:path'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as adminFreelancerService from '../services/adminFreelancerService.js'

export const listFreelancers = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query
  const result = await adminFreelancerService.listFreelancers({
    status,
    search,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Freelancers retrieved',
    data: { freelancers: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getFreelancerDetail = asyncHandler(async (req, res) => {
  const detail = await adminFreelancerService.getFreelancerDetail(Number(req.params.id))
  sendSuccess(res, { message: 'Freelancer detail retrieved', data: detail })
})

export const verifyFreelancerProfile = asyncHandler(async (req, res) => {
  await adminFreelancerService.verifyFreelancerProfile(Number(req.params.id), req.user.id, req)
  sendSuccess(res, { message: 'Freelancer profile verified' })
})

export const rejectFreelancerProfile = asyncHandler(async (req, res) => {
  await adminFreelancerService.rejectFreelancerProfile(Number(req.params.id), req.user.id, req.body.reason, req)
  sendSuccess(res, { message: 'Freelancer profile rejected' })
})

export const activateFreelancerAccount = asyncHandler(async (req, res) => {
  await adminFreelancerService.activateFreelancerAccount(Number(req.params.id), req.user.id, req)
  sendSuccess(res, { message: 'Freelancer account activated' })
})

export const suspendFreelancerAccount = asyncHandler(async (req, res) => {
  await adminFreelancerService.suspendFreelancerAccount(Number(req.params.id), req.user.id, req)
  sendSuccess(res, { message: 'Freelancer account suspended' })
})

export const downloadFreelancerDocument = asyncHandler(async (req, res) => {
  const document = await adminFreelancerService.getDocumentForDownload(Number(req.params.documentId))
  const absolutePath = path.join(process.cwd(), document.file_path)
  res.download(absolutePath, document.original_filename ?? `document-${document.id}`)
})

export const verifyFreelancerDocument = asyncHandler(async (req, res) => {
  await adminFreelancerService.verifyFreelancerDocument(Number(req.params.documentId), req.user.id, req)
  sendSuccess(res, { message: 'Document verified' })
})

export const rejectFreelancerDocument = asyncHandler(async (req, res) => {
  await adminFreelancerService.rejectFreelancerDocument(Number(req.params.documentId), req.user.id, req)
  sendSuccess(res, { message: 'Document rejected' })
})
