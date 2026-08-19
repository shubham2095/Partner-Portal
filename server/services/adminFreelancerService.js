import { ApiError } from '../utils/ApiError.js'
import {
  listProfiles,
  findProfileById,
  findProfileDetailById,
  updateProfileStatus,
} from '../models/freelancerProfileModel.js'
import {
  findDocumentsByFreelancerId,
  findDocumentById,
  updateDocumentStatus,
} from '../models/freelancerDocumentModel.js'
import { setUserActiveStatus } from '../models/userModel.js'
import { logAudit } from './auditService.js'

export async function listFreelancers({ status, search, page, limit }) {
  const { rows, total } = await listProfiles({ status, search, page, limit })
  return { rows, total, page, limit }
}

export async function getFreelancerDetail(profileId) {
  const profile = await findProfileDetailById(profileId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer not found')
  }
  const documents = await findDocumentsByFreelancerId(profileId)
  return { profile, documents }
}

async function requireProfile(profileId) {
  const profile = await findProfileById(profileId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer not found')
  }
  return profile
}

async function requireDocument(documentId) {
  const document = await findDocumentById(documentId)
  if (!document) {
    throw new ApiError(404, 'Document not found')
  }
  return document
}

export async function verifyFreelancerProfile(profileId, adminId, req) {
  const profile = await requireProfile(profileId)
  await updateProfileStatus(profileId, {
    status: 'VERIFIED',
    rejectionReason: null,
    verifiedBy: adminId,
    verifiedAt: new Date(),
  })
  await logAudit({
    actorId: adminId,
    action: 'FREELANCER_PROFILE_VERIFIED',
    entity: 'freelancer_profile',
    entityId: profileId,
    oldValue: { status: profile.status },
    newValue: { status: 'VERIFIED' },
    req,
  })
}

export async function rejectFreelancerProfile(profileId, adminId, reason, req) {
  const profile = await requireProfile(profileId)
  await updateProfileStatus(profileId, {
    status: 'REJECTED',
    rejectionReason: reason,
    verifiedBy: adminId,
    verifiedAt: new Date(),
  })
  await logAudit({
    actorId: adminId,
    action: 'FREELANCER_PROFILE_REJECTED',
    entity: 'freelancer_profile',
    entityId: profileId,
    oldValue: { status: profile.status },
    newValue: { status: 'REJECTED', rejectionReason: reason },
    req,
  })
}

export async function activateFreelancerAccount(profileId, adminId, req) {
  const profile = await requireProfile(profileId)
  await setUserActiveStatus(profile.user_id, true)
  await logAudit({
    actorId: adminId,
    action: 'FREELANCER_ACCOUNT_ACTIVATED',
    entity: 'user',
    entityId: profile.user_id,
    oldValue: { isActive: false },
    newValue: { isActive: true },
    req,
  })
}

export async function suspendFreelancerAccount(profileId, adminId, req) {
  const profile = await requireProfile(profileId)
  await setUserActiveStatus(profile.user_id, false)
  await logAudit({
    actorId: adminId,
    action: 'FREELANCER_ACCOUNT_SUSPENDED',
    entity: 'user',
    entityId: profile.user_id,
    oldValue: { isActive: true },
    newValue: { isActive: false },
    req,
  })
}

export async function verifyFreelancerDocument(documentId, adminId, req) {
  const document = await requireDocument(documentId)
  await updateDocumentStatus(documentId, {
    status: 'VERIFIED',
    verifiedBy: adminId,
    verifiedAt: new Date(),
  })
  await logAudit({
    actorId: adminId,
    action: 'FREELANCER_DOCUMENT_VERIFIED',
    entity: 'freelancer_document',
    entityId: documentId,
    oldValue: { status: document.status },
    newValue: { status: 'VERIFIED' },
    req,
  })
}

export async function rejectFreelancerDocument(documentId, adminId, req) {
  const document = await requireDocument(documentId)
  await updateDocumentStatus(documentId, {
    status: 'REJECTED',
    verifiedBy: adminId,
    verifiedAt: new Date(),
  })
  await logAudit({
    actorId: adminId,
    action: 'FREELANCER_DOCUMENT_REJECTED',
    entity: 'freelancer_document',
    entityId: documentId,
    oldValue: { status: document.status },
    newValue: { status: 'REJECTED' },
    req,
  })
}
