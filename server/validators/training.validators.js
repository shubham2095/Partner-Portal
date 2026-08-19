import { param, query, body } from 'express-validator'

const CATEGORY_STATUSES = ['ACTIVE', 'INACTIVE']
const TRAINING_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED']
const ACCESS_LEVELS = ['ALL', 'VERIFIED', 'QUALIFIED', 'CERTIFIED', 'ACTIVE']
const LESSON_TYPES = ['VIDEO', 'MATERIAL']

// Categories

export const listCategoriesValidator = [
  query('status').optional().isIn(CATEGORY_STATUSES),
  query('search').optional().trim().isLength({ max: 150 }),
]

export const categoryIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid category id')]

export const createCategoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 150 }),
  body('description').optional({ values: 'null' }).trim(),
  body('displayOrder').optional().isInt({ min: 0 }),
]

export const updateCategoryValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('description').optional({ values: 'null' }).trim(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('status').optional().isIn(CATEGORY_STATUSES),
]

// Trainings

export const listTrainingsValidator = [
  query('status').optional().isIn(TRAINING_STATUSES),
  query('categoryId').optional().isInt({ min: 1 }),
  query('search').optional().trim().isLength({ max: 150 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const trainingIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid training id')]

export const createTrainingValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('categoryId').optional({ values: 'null' }).isInt({ min: 1 }),
  body('thumbnailUrl').optional({ values: 'falsy' }).trim().isURL().withMessage('Enter a valid thumbnail URL'),
  body('accessLevel').optional().isIn(ACCESS_LEVELS).withMessage('Invalid access level'),
]

export const updateTrainingValidator = [
  body('title').optional().trim().notEmpty().isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('categoryId').optional({ values: 'null' }).isInt({ min: 1 }),
  body('thumbnailUrl').optional({ values: 'falsy' }).trim().isURL().withMessage('Enter a valid thumbnail URL'),
  body('accessLevel').optional().isIn(ACCESS_LEVELS).withMessage('Invalid access level'),
]

export const changeTrainingStatusValidator = [
  body('status').isIn(TRAINING_STATUSES).withMessage('Invalid training status'),
]

// Modules

export const moduleIdParamValidator = [param('moduleId').isInt({ min: 1 }).withMessage('Invalid module id')]

export const createModuleValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('displayOrder').optional().isInt({ min: 0 }),
]

export const updateModuleValidator = [
  body('title').optional().trim().notEmpty().isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('displayOrder').optional().isInt({ min: 0 }),
]

// Lessons

export const lessonIdParamValidator = [param('lessonId').isInt({ min: 1 }).withMessage('Invalid lesson id')]

export const createLessonValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('lessonType').isIn(LESSON_TYPES).withMessage('Invalid lesson type'),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('durationMinutes').optional({ values: 'null' }).isInt({ min: 0 }),
]

export const updateLessonValidator = [
  body('title').optional().trim().notEmpty().isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('durationMinutes').optional({ values: 'null' }).isInt({ min: 0 }),
]

// Materials

export const materialIdParamValidator = [param('materialId').isInt({ min: 1 }).withMessage('Invalid material id')]

export const uploadMaterialValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('displayOrder').optional().isInt({ min: 0 }),
]

// Videos

export const videoIdParamValidator = [param('videoId').isInt({ min: 1 }).withMessage('Invalid video id')]

export const createVideoValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('videoUrl').trim().notEmpty().withMessage('Video URL is required').isURL().withMessage('Enter a valid video URL'),
  body('thumbnailUrl').optional({ values: 'falsy' }).trim().isURL().withMessage('Enter a valid thumbnail URL'),
  body('durationSeconds').optional({ values: 'null' }).isInt({ min: 0 }),
  body('displayOrder').optional().isInt({ min: 0 }),
]

export const updateVideoValidator = [
  body('title').optional().trim().notEmpty().isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('videoUrl').optional().trim().notEmpty().isURL().withMessage('Enter a valid video URL'),
  body('thumbnailUrl').optional({ values: 'falsy' }).trim().isURL().withMessage('Enter a valid thumbnail URL'),
  body('durationSeconds').optional({ values: 'null' }).isInt({ min: 0 }),
  body('displayOrder').optional().isInt({ min: 0 }),
]

// Freelancer progress

export const saveVideoProgressValidator = [
  body('positionSeconds').isInt({ min: 0 }).withMessage('positionSeconds must be a non-negative integer'),
]
