import path from 'node:path'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import * as freelancerService from '../services/freelancerService.js'

const FIELD_MAP = {
  fullName: 'full_name',
  mobile: 'mobile',
  location: 'location',
  dateOfBirth: 'date_of_birth',
  currentOccupation: 'current_occupation',
  totalExperienceYears: 'total_experience_years',
  digitalMarketingExperience: 'digital_marketing_experience',
  salesExperience: 'sales_experience',
  skills: 'skills',
  specializations: 'specializations',
  preferredWorkingAreas: 'preferred_working_areas',
  previousAgencyExperience: 'previous_agency_experience',
  bio: 'bio',
  preferredCommunication: 'preferred_communication',
}

function mapProfileFields(body) {
  const fields = {}
  for (const [camelKey, columnKey] of Object.entries(FIELD_MAP)) {
    if (body[camelKey] !== undefined) {
      fields[columnKey] = body[camelKey]
    }
  }
  return fields
}

function toRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/')
}

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await freelancerService.getMyProfile(req.user.id)
  sendSuccess(res, { message: 'Profile retrieved', data: { profile } })
})

export const updateMyProfile = asyncHandler(async (req, res) => {
  const fields = mapProfileFields(req.body)
  const profile = await freelancerService.updateMyProfessionalDetails(req.user.id, fields)
  sendSuccess(res, { message: 'Profile updated successfully', data: { profile } })
})

export const uploadMyProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(422, 'A profile photo file is required')
  }
  const profile = await freelancerService.updateMyProfilePhoto(req.user.id, toRelativePath(req.file.path))
  sendSuccess(res, { message: 'Profile photo uploaded successfully', data: { profile } })
})

export const uploadMyDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(422, 'A document file is required')
  }
  const documentId = await freelancerService.addMyDocument(req.user.id, {
    documentType: req.body.documentType,
    filePath: toRelativePath(req.file.path),
    originalFilename: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
  })
  sendSuccess(res, { statusCode: 201, message: 'Document uploaded successfully', data: { documentId } })
})

export const listMyDocuments = asyncHandler(async (req, res) => {
  const documents = await freelancerService.listMyDocuments(req.user.id)
  sendSuccess(res, { message: 'Documents retrieved', data: { documents } })
})
