import { param, query, body } from 'express-validator'

const WEBINAR_STATUSES = ['DRAFT', 'PUBLISHED', 'LIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED']
const REGISTRATION_STATUSES = ['REGISTERED', 'ATTENDED', 'ABSENT', 'CANCELLED']
const ATTENDANCE_STATUSES = ['REGISTERED', 'ATTENDED', 'ABSENT']

export const listWebinarsValidator = [
  query('status').optional().isIn(WEBINAR_STATUSES).withMessage('Invalid status filter'),
  query('search').optional().trim().isLength({ max: 150 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const webinarIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid webinar id')]

export const createWebinarValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('speakerName').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('speakerBio').optional({ values: 'null' }).trim(),
  body('scheduledAt').isISO8601().withMessage('A valid scheduled date/time is required'),
  body('durationMinutes').optional({ values: 'null' }).isInt({ min: 1 }),
  body('registrationUrl').optional({ values: 'falsy' }).trim().isURL().withMessage('Enter a valid registration URL'),
  body('meetingUrl').optional({ values: 'falsy' }).trim().isURL().withMessage('Enter a valid meeting URL'),
  body('recordingUrl').optional({ values: 'falsy' }).trim().isURL().withMessage('Enter a valid recording URL'),
  body('trainingMaterialUrl').optional({ values: 'falsy' }).trim().isURL().withMessage('Enter a valid training material URL'),
]

export const updateWebinarValidator = [
  body('title').optional().trim().isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim(),
  body('speakerName').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('speakerBio').optional({ values: 'null' }).trim(),
  body('scheduledAt').optional().isISO8601(),
  body('durationMinutes').optional({ values: 'null' }).isInt({ min: 1 }),
  body('registrationUrl').optional({ values: 'falsy' }).trim().isURL(),
  body('meetingUrl').optional({ values: 'falsy' }).trim().isURL(),
  body('recordingUrl').optional({ values: 'falsy' }).trim().isURL(),
  body('trainingMaterialUrl').optional({ values: 'falsy' }).trim().isURL(),
]

export const changeWebinarStatusValidator = [
  body('status').isIn(WEBINAR_STATUSES).withMessage('Invalid webinar status'),
]

export const listRegistrationsValidator = [
  query('status').optional().isIn(REGISTRATION_STATUSES),
  query('search').optional().trim().isLength({ max: 150 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const registrationIdParamValidator = [
  param('registrationId').isInt({ min: 1 }).withMessage('Invalid registration id'),
]

export const markAttendanceValidator = [
  body('attendanceStatus').isIn(ATTENDANCE_STATUSES).withMessage('Invalid attendance status'),
  body('joinTime').optional({ values: 'null' }).isISO8601(),
  body('leaveTime').optional({ values: 'null' }).isISO8601(),
  body('notes').optional({ values: 'null' }).trim().isLength({ max: 1000 }),
]

export const registerWebinarValidator = [
  body('source').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('campaign').optional({ values: 'null' }).trim().isLength({ max: 150 }),
]
