import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import { findCertificateById, listCertificatesByFreelancer } from '../models/certificateModel.js'

async function requireProfile(userId) {
  const profile = await findProfileByUserId(userId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }
  return profile
}

export async function listMyCertificates(userId) {
  const profile = await requireProfile(userId)
  return listCertificatesByFreelancer(profile.id)
}

export async function getMyCertificateDetail(certificateId, userId) {
  const profile = await requireProfile(userId)
  const certificate = await findCertificateById(certificateId)
  if (!certificate || certificate.freelancer_id !== profile.id) {
    throw new ApiError(404, 'Certificate not found')
  }
  return certificate
}
