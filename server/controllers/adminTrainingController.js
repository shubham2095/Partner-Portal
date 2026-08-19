import path from 'node:path'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as adminTrainingService from '../services/adminTrainingService.js'

// Categories

export const listCategories = asyncHandler(async (req, res) => {
  const { status, search } = req.query
  const categories = await adminTrainingService.listCategories({ status, search })
  sendSuccess(res, { message: 'Categories retrieved', data: { categories } })
})

export const createCategory = asyncHandler(async (req, res) => {
  const category = await adminTrainingService.createCategory(req.body, req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Category created', data: { category } })
})

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await adminTrainingService.updateCategory(Number(req.params.id), req.body, req.user.id, req)
  sendSuccess(res, { message: 'Category updated', data: { category } })
})

// Trainings

export const listTrainings = asyncHandler(async (req, res) => {
  const { status, categoryId, search, page = 1, limit = 20 } = req.query
  const result = await adminTrainingService.listTrainings({
    status,
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

export const createTraining = asyncHandler(async (req, res) => {
  const training = await adminTrainingService.createTraining(req.body, req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Training created', data: { training } })
})

export const getTrainingDetail = asyncHandler(async (req, res) => {
  const detail = await adminTrainingService.getTrainingDetail(Number(req.params.id))
  sendSuccess(res, { message: 'Training detail retrieved', data: detail })
})

export const updateTraining = asyncHandler(async (req, res) => {
  const training = await adminTrainingService.updateTraining(Number(req.params.id), req.body, req.user.id, req)
  sendSuccess(res, { message: 'Training updated', data: { training } })
})

export const changeTrainingStatus = asyncHandler(async (req, res) => {
  const training = await adminTrainingService.changeTrainingStatus(Number(req.params.id), req.body.status, req.user.id, req)
  sendSuccess(res, { message: 'Training status updated', data: { training } })
})

// Modules

export const addModule = asyncHandler(async (req, res) => {
  const module_ = await adminTrainingService.addModule(Number(req.params.id), req.body, req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Module added', data: { module: module_ } })
})

export const updateModule = asyncHandler(async (req, res) => {
  const module_ = await adminTrainingService.updateModule(Number(req.params.moduleId), req.body, req.user.id, req)
  sendSuccess(res, { message: 'Module updated', data: { module: module_ } })
})

export const removeModule = asyncHandler(async (req, res) => {
  await adminTrainingService.removeModule(Number(req.params.moduleId), req.user.id, req)
  sendSuccess(res, { message: 'Module removed', data: {} })
})

// Lessons

export const addLesson = asyncHandler(async (req, res) => {
  const lesson = await adminTrainingService.addLesson(Number(req.params.moduleId), req.body, req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Lesson added', data: { lesson } })
})

export const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await adminTrainingService.updateLesson(Number(req.params.lessonId), req.body, req.user.id, req)
  sendSuccess(res, { message: 'Lesson updated', data: { lesson } })
})

export const removeLesson = asyncHandler(async (req, res) => {
  await adminTrainingService.removeLesson(Number(req.params.lessonId), req.user.id, req)
  sendSuccess(res, { message: 'Lesson removed', data: {} })
})

// Materials

export const addMaterial = asyncHandler(async (req, res) => {
  const material = await adminTrainingService.addMaterial(Number(req.params.lessonId), req.file, req.body, req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Material uploaded', data: { material } })
})

export const removeMaterial = asyncHandler(async (req, res) => {
  await adminTrainingService.removeMaterial(Number(req.params.materialId), req.user.id, req)
  sendSuccess(res, { message: 'Material removed', data: {} })
})

export const downloadMaterial = asyncHandler(async (req, res) => {
  const material = await adminTrainingService.getMaterialForAdminDownload(Number(req.params.materialId))
  const absolutePath = path.join(process.cwd(), material.file_path)
  res.download(absolutePath, material.original_filename ?? material.title)
})

// Videos

export const addVideo = asyncHandler(async (req, res) => {
  const video = await adminTrainingService.addVideo(Number(req.params.lessonId), req.body, req.user.id, req)
  sendSuccess(res, { statusCode: 201, message: 'Video added', data: { video } })
})

export const updateVideo = asyncHandler(async (req, res) => {
  const video = await adminTrainingService.updateVideo(Number(req.params.videoId), req.body, req.user.id, req)
  sendSuccess(res, { message: 'Video updated', data: { video } })
})

export const removeVideo = asyncHandler(async (req, res) => {
  await adminTrainingService.removeVideo(Number(req.params.videoId), req.user.id, req)
  sendSuccess(res, { message: 'Video removed', data: {} })
})
