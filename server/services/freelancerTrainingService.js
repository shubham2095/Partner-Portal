import { pool } from '../config/database.js'
import { ApiError } from '../utils/ApiError.js'
import { findProfileByUserId } from '../models/freelancerProfileModel.js'
import { ACCESS_LEVEL_RANK, findTrainingById, listVisibleTrainings } from '../models/trainingModel.js'
import { listModulesByTraining } from '../models/trainingModuleModel.js'
import { listLessonsByModule, findLessonWithTraining } from '../models/trainingLessonModel.js'
import { listMaterialsByLesson, findMaterialWithTraining } from '../models/trainingMaterialModel.js'
import { listVideosByLesson, findVideoWithTraining } from '../models/videoModel.js'
import {
  ensureEnrollment,
  findEnrollment,
  updateEnrollmentProgress,
  listEnrollmentsByFreelancer,
} from '../models/trainingEnrollmentModel.js'
import {
  findLessonProgress,
  touchLessonProgress,
  markLessonCompleted,
  listProgressByTrainingAndFreelancer,
  countCompletedLessons,
} from '../models/lessonProgressModel.js'
import { findWatchRecord, upsertWatchProgress } from '../models/videoWatchModel.js'

const STATUS_ACCESS_RANK = {
  PENDING: 0,
  VERIFIED: 1,
  QUALIFIED: 2,
  CERTIFIED: 3,
  ACTIVE: 4,
}

async function requireProfile(userId) {
  const profile = await findProfileByUserId(userId)
  if (!profile) {
    throw new ApiError(404, 'Freelancer profile not found')
  }
  return profile
}

function getAccessRank(profile) {
  return Object.prototype.hasOwnProperty.call(STATUS_ACCESS_RANK, profile.status)
    ? STATUS_ACCESS_RANK[profile.status]
    : null
}

async function assertTrainingAccessible(training, profile) {
  if (!training || training.status !== 'PUBLISHED') {
    throw new ApiError(404, 'Training not found')
  }
  const rank = getAccessRank(profile)
  if (rank === null || ACCESS_LEVEL_RANK[training.access_level] > rank) {
    throw new ApiError(403, 'You are not authorized to access this training')
  }
}

async function recomputeEnrollmentProgress(trainingId, freelancerId, executor = pool) {
  const training = await findTrainingById(trainingId, executor)
  const completed = await countCompletedLessons(trainingId, freelancerId, executor)
  const total = training?.total_lessons ?? 0
  const percentage = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0
  const status = total > 0 && completed >= total ? 'COMPLETED' : 'IN_PROGRESS'

  const existing = await findEnrollment(trainingId, freelancerId, executor)
  const completedAt = status === 'COMPLETED' ? existing?.completed_at ?? new Date() : null

  await updateEnrollmentProgress(trainingId, freelancerId, { progressPercentage: percentage, status, completedAt }, executor)
}

export async function listAccessibleTrainings(userId, { categoryId, search, page, limit }) {
  const profile = await requireProfile(userId)
  const rank = getAccessRank(profile)
  if (rank === null) {
    return { rows: [], total: 0, page, limit }
  }
  const { rows, total } = await listVisibleTrainings({ accessRank: rank, categoryId, search, page, limit })

  const enrollments = await listEnrollmentsByFreelancer(profile.id)
  const progressByTraining = new Map(enrollments.map((row) => [row.training_id, row]))

  const withProgress = rows.map((training) => ({
    ...training,
    progress: progressByTraining.get(training.id) ?? null,
  }))

  return { rows: withProgress, total, page, limit }
}

export async function getTrainingDetail(trainingId, userId) {
  const profile = await requireProfile(userId)
  const training = await findTrainingById(trainingId)
  await assertTrainingAccessible(training, profile)

  await ensureEnrollment(trainingId, profile.id)

  const modules = await listModulesByTraining(trainingId)
  const progressRows = await listProgressByTrainingAndFreelancer(trainingId, profile.id)
  const progressByLesson = new Map(progressRows.map((row) => [row.lesson_id, row]))

  const modulesWithLessons = []
  for (const module of modules) {
    const lessons = await listLessonsByModule(module.id)
    const enrichedLessons = []
    for (const lesson of lessons) {
      const progress = progressByLesson.get(lesson.id) ?? null
      let content = null
      if (lesson.lesson_type === 'VIDEO') {
        const videos = await listVideosByLesson(lesson.id)
        content = videos
      } else {
        const materials = await listMaterialsByLesson(lesson.id)
        content = materials
      }
      enrichedLessons.push({ ...lesson, progress, content })
    }
    modulesWithLessons.push({ ...module, lessons: enrichedLessons })
  }

  const enrollment = await findEnrollment(trainingId, profile.id)

  return { training, modules: modulesWithLessons, enrollment }
}

export async function markLessonComplete(lessonId, userId) {
  const profile = await requireProfile(userId)
  const lesson = await findLessonWithTraining(lessonId)
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found')
  }
  const training = await findTrainingById(lesson.training_id)
  await assertTrainingAccessible(training, profile)

  await markLessonCompleted(lessonId, profile.id)
  await recomputeEnrollmentProgress(lesson.training_id, profile.id)

  return findLessonProgress(lessonId, profile.id)
}

export async function saveVideoProgress(videoId, userId, { positionSeconds }) {
  const profile = await requireProfile(userId)
  const video = await findVideoWithTraining(videoId)
  if (!video) {
    throw new ApiError(404, 'Video not found')
  }
  const training = await findTrainingById(video.training_id)
  await assertTrainingAccessible(training, profile)

  await touchLessonProgress(video.lesson_id, profile.id)

  const isCompleted = Boolean(video.duration_seconds) && positionSeconds >= Math.floor(video.duration_seconds * 0.9)

  const record = await upsertWatchProgress(videoId, profile.id, {
    lastPositionSeconds: positionSeconds,
    watchedSeconds: positionSeconds,
    isCompleted,
  })

  if (isCompleted) {
    await markLessonCompleted(video.lesson_id, profile.id)
    await recomputeEnrollmentProgress(video.training_id, profile.id)
  }

  return record
}

export async function getMaterialForDownload(materialId, userId) {
  const profile = await requireProfile(userId)
  const material = await findMaterialWithTraining(materialId)
  if (!material) {
    throw new ApiError(404, 'Material not found')
  }
  const training = await findTrainingById(material.training_id)
  await assertTrainingAccessible(training, profile)

  await touchLessonProgress(material.lesson_id, profile.id)

  return material
}

export async function listMyEnrollments(userId) {
  const profile = await requireProfile(userId)
  return listEnrollmentsByFreelancer(profile.id)
}

export async function getTrainingDashboardSummary(userId) {
  const profile = await requireProfile(userId)
  const enrollments = await listEnrollmentsByFreelancer(profile.id)

  const totalEnrolled = enrollments.length
  const totalCompleted = enrollments.filter((row) => row.status === 'COMPLETED').length
  const averageProgress =
    totalEnrolled > 0
      ? Math.round((enrollments.reduce((sum, row) => sum + Number(row.progress_percentage), 0) / totalEnrolled) * 100) / 100
      : 0

  const recentActivity = enrollments.slice(0, 5).map((row) => ({
    trainingId: row.training_id,
    trainingTitle: row.training_title,
    status: row.status,
    progressPercentage: row.progress_percentage,
    lastAccessedAt: row.last_accessed_at,
  }))

  return {
    certificationState: profile.status,
    totalEnrolled,
    totalCompleted,
    averageProgress,
    recentActivity,
  }
}
