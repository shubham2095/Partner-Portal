import fs from 'node:fs'
import path from 'node:path'
import { ApiError } from '../utils/ApiError.js'
import {
  createCategory as createCategoryModel,
  findCategoryById,
  updateCategory as updateCategoryModel,
  listCategories as listCategoriesModel,
} from '../models/trainingCategoryModel.js'
import {
  createTraining as createTrainingModel,
  findTrainingById,
  updateTraining as updateTrainingModel,
  updateTrainingStatus,
  recomputeTrainingTotals,
  listTrainingsAdmin,
  ACCESS_LEVEL_RANK,
} from '../models/trainingModel.js'
import { pool } from '../config/database.js'
import { notify } from './notificationService.js'
import {
  createModule as createModuleModel,
  findModuleById,
  updateModule as updateModuleModel,
  deleteModule as deleteModuleModel,
  listModulesByTraining,
} from '../models/trainingModuleModel.js'
import {
  createLesson as createLessonModel,
  findLessonById,
  findLessonWithTraining,
  updateLesson as updateLessonModel,
  deleteLesson as deleteLessonModel,
  listLessonsByModule,
} from '../models/trainingLessonModel.js'
import {
  createMaterial as createMaterialModel,
  findMaterialById,
  findMaterialWithTraining,
  deleteMaterial as deleteMaterialModel,
  listMaterialsByLesson,
} from '../models/trainingMaterialModel.js'
import {
  createVideo as createVideoModel,
  findVideoById,
  findVideoWithTraining,
  updateVideo as updateVideoModel,
  deleteVideo as deleteVideoModel,
  listVideosByLesson,
} from '../models/videoModel.js'
import { logAudit } from './auditService.js'

const TRAINING_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

async function requireTraining(id) {
  const training = await findTrainingById(id)
  if (!training) {
    throw new ApiError(404, 'Training not found')
  }
  return training
}

async function requireModule(id) {
  const module_ = await findModuleById(id)
  if (!module_) {
    throw new ApiError(404, 'Training module not found')
  }
  return module_
}

async function requireLesson(id) {
  const lesson = await findLessonById(id)
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found')
  }
  return lesson
}

// ---- Categories ----

export async function listCategories(query) {
  return listCategoriesModel(query)
}

export async function createCategory(payload, adminId, req) {
  const id = await createCategoryModel({ ...payload, createdBy: adminId })
  await logAudit({ actorId: adminId, action: 'TRAINING_CATEGORY_CREATED', entity: 'training_category', entityId: id, newValue: payload, req })
  return findCategoryById(id)
}

export async function updateCategory(id, fields, adminId, req) {
  const category = await findCategoryById(id)
  if (!category) {
    throw new ApiError(404, 'Category not found')
  }
  await updateCategoryModel(id, fields)
  await logAudit({ actorId: adminId, action: 'TRAINING_CATEGORY_UPDATED', entity: 'training_category', entityId: id, oldValue: category, newValue: fields, req })
  return findCategoryById(id)
}

// ---- Trainings ----

export async function listTrainings(query) {
  const { rows, total } = await listTrainingsAdmin(query)
  return { rows, total, page: query.page, limit: query.limit }
}

export async function createTraining(payload, adminId, req) {
  const id = await createTrainingModel({ ...payload, createdBy: adminId })
  await logAudit({ actorId: adminId, action: 'TRAINING_CREATED', entity: 'training', entityId: id, newValue: { title: payload.title }, req })
  return findTrainingById(id)
}

export async function getTrainingDetail(id) {
  const training = await requireTraining(id)
  const modules = await listModulesByTraining(id)
  const modulesWithLessons = []
  for (const module_ of modules) {
    const lessons = await listLessonsByModule(module_.id)
    const enrichedLessons = []
    for (const lesson of lessons) {
      const content =
        lesson.lesson_type === 'VIDEO' ? await listVideosByLesson(lesson.id) : await listMaterialsByLesson(lesson.id)
      enrichedLessons.push({ ...lesson, content })
    }
    modulesWithLessons.push({ ...module_, lessons: enrichedLessons })
  }
  return { training, modules: modulesWithLessons }
}

export async function updateTraining(id, fields, adminId, req) {
  const training = await requireTraining(id)
  await updateTrainingModel(id, fields)
  await logAudit({ actorId: adminId, action: 'TRAINING_UPDATED', entity: 'training', entityId: id, oldValue: training, newValue: fields, req })
  return findTrainingById(id)
}

export async function changeTrainingStatus(id, status, adminId, req) {
  const training = await requireTraining(id)
  if (!TRAINING_STATUSES.includes(status)) {
    throw new ApiError(422, 'Invalid training status')
  }
  await updateTrainingStatus(id, status)
  await logAudit({ actorId: adminId, action: 'TRAINING_STATUS_CHANGED', entity: 'training', entityId: id, oldValue: { status: training.status }, newValue: { status }, req })

  if (status === 'PUBLISHED') {
    notifyEligibleFreelancers(id, training.title, training.access_level).catch((error) =>
      console.error('[adminTrainingService] Failed to notify freelancers of published training:', error.message)
    )
  }

  return findTrainingById(id)
}

const STATUS_ACCESS_RANK = { PENDING: 0, VERIFIED: 1, QUALIFIED: 2, CERTIFIED: 3, ACTIVE: 4 }

async function notifyEligibleFreelancers(trainingId, trainingTitle, accessLevel) {
  const minRank = ACCESS_LEVEL_RANK[accessLevel] ?? 0
  const eligibleStatuses = Object.entries(STATUS_ACCESS_RANK)
    .filter(([, rank]) => rank >= minRank)
    .map(([statusName]) => statusName)
  if (eligibleStatuses.length === 0) return

  const [rows] = await pool.query(
    `SELECT user_id FROM freelancer_profiles WHERE status IN (${eligibleStatuses.map(() => '?').join(',')})`,
    eligibleStatuses
  )

  await Promise.all(
    rows.map((row) =>
      notify({
        recipientUserId: row.user_id,
        type: 'TRAINING_PUBLISHED',
        title: 'New training available',
        message: `${trainingTitle} is now available for you.`,
        relatedEntityType: 'training',
        relatedEntityId: trainingId,
      }).catch((error) => console.error('[adminTrainingService] Notify failed for user', row.user_id, error.message))
    )
  )
}

// ---- Modules ----

export async function addModule(trainingId, payload, adminId, req) {
  await requireTraining(trainingId)
  const id = await createModuleModel({ trainingId, ...payload })
  await recomputeTrainingTotals(trainingId)
  await logAudit({ actorId: adminId, action: 'TRAINING_MODULE_CREATED', entity: 'training', entityId: trainingId, newValue: { moduleId: id, title: payload.title }, req })
  return findModuleById(id)
}

export async function updateModule(moduleId, fields, adminId, req) {
  const module_ = await requireModule(moduleId)
  await updateModuleModel(moduleId, fields)
  await logAudit({ actorId: adminId, action: 'TRAINING_MODULE_UPDATED', entity: 'training', entityId: module_.training_id, oldValue: module_, newValue: fields, req })
  return findModuleById(moduleId)
}

export async function removeModule(moduleId, adminId, req) {
  const module_ = await requireModule(moduleId)
  await deleteModuleModel(moduleId)
  await recomputeTrainingTotals(module_.training_id)
  await logAudit({ actorId: adminId, action: 'TRAINING_MODULE_DELETED', entity: 'training', entityId: module_.training_id, oldValue: module_, req })
}

// ---- Lessons ----

export async function addLesson(moduleId, payload, adminId, req) {
  const module_ = await requireModule(moduleId)
  const id = await createLessonModel({ moduleId, ...payload })
  await recomputeTrainingTotals(module_.training_id)
  await logAudit({ actorId: adminId, action: 'TRAINING_LESSON_CREATED', entity: 'training', entityId: module_.training_id, newValue: { lessonId: id, title: payload.title, lessonType: payload.lessonType }, req })
  return findLessonById(id)
}

export async function updateLesson(lessonId, fields, adminId, req) {
  const lesson = await requireLesson(lessonId)
  await updateLessonModel(lessonId, fields)
  await logAudit({ actorId: adminId, action: 'TRAINING_LESSON_UPDATED', entity: 'training_lesson', entityId: lessonId, oldValue: lesson, newValue: fields, req })
  return findLessonById(lessonId)
}

export async function removeLesson(lessonId, adminId, req) {
  const lesson = await findLessonWithTraining(lessonId)
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found')
  }
  await deleteLessonModel(lessonId)
  await recomputeTrainingTotals(lesson.training_id)
  await logAudit({ actorId: adminId, action: 'TRAINING_LESSON_DELETED', entity: 'training', entityId: lesson.training_id, oldValue: lesson, req })
}

// ---- Materials ----

const MATERIAL_TYPE_BY_MIME = {
  'application/pdf': 'PDF',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPT',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOC',
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
}

function toRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/')
}

export async function addMaterial(lessonId, file, payload, adminId, req) {
  const lesson = await requireLesson(lessonId)
  if (lesson.lesson_type !== 'MATERIAL') {
    throw new ApiError(422, 'Materials can only be attached to MATERIAL-type lessons')
  }
  if (!file) {
    throw new ApiError(422, 'A material file is required')
  }

  const id = await createMaterialModel({
    lessonId,
    title: payload.title,
    materialType: MATERIAL_TYPE_BY_MIME[file.mimetype] ?? 'OTHER',
    filePath: toRelativePath(file.path),
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    displayOrder: payload.displayOrder,
    createdBy: adminId,
  })

  await logAudit({ actorId: adminId, action: 'TRAINING_MATERIAL_UPLOADED', entity: 'training_lesson', entityId: lessonId, newValue: { materialId: id, title: payload.title }, req })
  return findMaterialById(id)
}

export async function removeMaterial(materialId, adminId, req) {
  const material = await findMaterialWithTraining(materialId)
  if (!material) {
    throw new ApiError(404, 'Material not found')
  }
  const absolutePath = path.join(process.cwd(), material.file_path)
  await deleteMaterialModel(materialId)
  fs.promises.unlink(absolutePath).catch(() => {})
  await logAudit({ actorId: adminId, action: 'TRAINING_MATERIAL_DELETED', entity: 'training_lesson', entityId: material.lesson_id, oldValue: { materialId, title: material.title }, req })
}

export async function getMaterialForAdminDownload(materialId) {
  const material = await findMaterialById(materialId)
  if (!material) {
    throw new ApiError(404, 'Material not found')
  }
  return material
}

// ---- Videos ----

export async function addVideo(lessonId, payload, adminId, req) {
  const lesson = await requireLesson(lessonId)
  if (lesson.lesson_type !== 'VIDEO') {
    throw new ApiError(422, 'Videos can only be attached to VIDEO-type lessons')
  }
  const id = await createVideoModel({ lessonId, ...payload, createdBy: adminId })
  await logAudit({ actorId: adminId, action: 'TRAINING_VIDEO_CREATED', entity: 'training_lesson', entityId: lessonId, newValue: { videoId: id, title: payload.title }, req })
  return findVideoById(id)
}

export async function updateVideo(videoId, fields, adminId, req) {
  const video = await findVideoById(videoId)
  if (!video) {
    throw new ApiError(404, 'Video not found')
  }
  await updateVideoModel(videoId, fields)
  await logAudit({ actorId: adminId, action: 'TRAINING_VIDEO_UPDATED', entity: 'training_lesson', entityId: video.lesson_id, oldValue: video, newValue: fields, req })
  return findVideoById(videoId)
}

export async function removeVideo(videoId, adminId, req) {
  const video = await findVideoWithTraining(videoId)
  if (!video) {
    throw new ApiError(404, 'Video not found')
  }
  await deleteVideoModel(videoId)
  await logAudit({ actorId: adminId, action: 'TRAINING_VIDEO_DELETED', entity: 'training_lesson', entityId: video.lesson_id, oldValue: { videoId, title: video.title }, req })
}
