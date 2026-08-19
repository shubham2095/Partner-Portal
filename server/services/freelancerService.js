import { ApiError } from '../utils/ApiError.js'
import {
  findProfileByUserId,
  updateProfessionalDetails,
  updateProfilePhoto,
} from '../models/freelancerProfileModel.js'
import { createDocument, findDocumentsByFreelancerId } from '../models/freelancerDocumentModel.js'

export async function getMyProfile(userId) {
  const profile = await findProfileByUserId(userId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }
  return profile
}

export async function updateMyProfessionalDetails(userId, fields) {
  const profile = await getMyProfile(userId)
  await updateProfessionalDetails(profile.id, fields)
  return getMyProfile(userId)
}

export async function updateMyProfilePhoto(userId, photoPath) {
  const profile = await getMyProfile(userId)
  await updateProfilePhoto(profile.id, photoPath)
  return getMyProfile(userId)
}

export async function addMyDocument(userId, { documentType, filePath, originalFilename, mimeType, fileSize }) {
  const profile = await getMyProfile(userId)
  return createDocument({
    freelancerId: profile.id,
    documentType,
    filePath,
    originalFilename,
    mimeType,
    fileSize,
  })
}

export async function listMyDocuments(userId) {
  const profile = await getMyProfile(userId)
  return findDocumentsByFreelancerId(profile.id)
}
