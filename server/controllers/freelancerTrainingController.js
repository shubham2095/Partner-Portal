import path from 'node:path'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as freelancerTrainingService from '../services/freelancerTrainingService.js'

export const listTrainings = asyncHandler(async (req, res) => {
  const { categoryId, search, page = 1, limit = 20 } = req.query
  const result = await freelancerTrainingService.listAccessibleTrainings(req.user.id, {
    categoryId: categoryId ? Number(categoryId) : undefined,
    search,
    page: Number(page),
    limit: Number(limit),
  })
  sendSuccess(res, {
    message: 'Trainings retrieved',
    data: { trainings: result.rows },
    meta: { total: result.total, page: result.page, limit: result.limit },
  })
})

export const getTrainingDetail = asyncHandler(async (req, res) => {
  const detail = await freelancerTrainingService.getTrainingDetail(Number(req.params.id), req.user.id)
  sendSuccess(res, { message: 'Training detail retrieved', data: detail })
})

export const listMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await freelancerTrainingService.listMyEnrollments(req.user.id)
  sendSuccess(res, { message: 'Enrollments retrieved', data: { enrollments } })
})

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await freelancerTrainingService.getTrainingDashboardSummary(req.user.id)
  sendSuccess(res, { message: 'Training dashboard summary retrieved', data: summary })
})

export const markLessonComplete = asyncHandler(async (req, res) => {
  const progress = await freelancerTrainingService.markLessonComplete(Number(req.params.lessonId), req.user.id)
  sendSuccess(res, { message: 'Lesson marked as complete', data: { progress } })
})

export const saveVideoProgress = asyncHandler(async (req, res) => {
  const record = await freelancerTrainingService.saveVideoProgress(Number(req.params.videoId), req.user.id, {
    positionSeconds: Number(req.body.positionSeconds),
  })
  sendSuccess(res, { message: 'Video progress saved', data: { progress: record } })
})

export const downloadMaterial = asyncHandler(async (req, res) => {
  const material = await freelancerTrainingService.getMaterialForDownload(Number(req.params.materialId), req.user.id)
  const absolutePath = path.join(process.cwd(), material.file_path)
  res.download(absolutePath, material.original_filename ?? material.title)
})
