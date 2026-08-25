import { param, query, body } from 'express-validator'

const LEAD_STATUSES = [
  'NEW',
  'CONTACT_ATTEMPTED',
  'CONTACTED',
  'INTERESTED',
  'MEETING_SCHEDULED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'FOLLOW_UP',
  'CONVERTED',
  'NOT_INTERESTED',
  'WRONG_NUMBER',
  'LOST',
  'FUTURE_OPPORTUNITY',
]

const ACTIVITY_TYPES = ['PHONE_CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'VIDEO_CALL', 'SITE_VISIT', 'NOTE_ADDED']
// VIDEO_CALL/SITE_VISIT predate the PDF spec and are kept for existing data;
// DEMO/OTHER are the PDF-required additions.
const FOLLOWUP_TYPES = ['PHONE_CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'VIDEO_CALL', 'SITE_VISIT', 'DEMO', 'OTHER']
const FOLLOWUP_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const SORT_COLUMNS = ['created_at', 'lead_date', 'expected_value', 'status', 'follow_up_date', 'client_name']

export const leadIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid lead id')]

export const followUpIdParamValidator = [
  param('followUpId').isInt({ min: 1 }).withMessage('Invalid follow-up id'),
]

export const listLeadsValidator = [
  query('status').optional().isIn(LEAD_STATUSES).withMessage('Invalid status filter'),
  query('source').optional().trim().isLength({ max: 100 }),
  query('assignedFreelancerId').optional().isInt({ min: 1 }),
  query('unassigned').optional().isBoolean(),
  query('search').optional().trim().isLength({ max: 150 }),
  query('sortBy').optional().isIn(SORT_COLUMNS),
  query('sortDir').optional().isIn(['ASC', 'DESC']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const createLeadValidator = [
  body('clientName').trim().notEmpty().withMessage('Client name is required').isLength({ max: 150 }),
  body('company').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('mobile').trim().notEmpty().withMessage('Mobile is required').isLength({ max: 20 }),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Enter a valid email'),
  body('location').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('businessCategory').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('serviceInterested').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('source').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('leadDate').optional({ values: 'falsy' }).isISO8601(),
  body('expectedValue').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  body('notes').optional({ values: 'null' }).trim(),
  // Optional first follow-up captured at lead-creation time — reuses the
  // existing follow-up system (see followUpService.createFollowUp) rather
  // than introducing a second one; followUpType defaults to PHONE_CALL when
  // omitted so the field can be provided alone.
  body('nextFollowUpDate').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid follow-up date/time'),
  body('followUpType').optional({ values: 'falsy' }).isIn(FOLLOWUP_TYPES).withMessage('Invalid follow-up type'),
]

export const updateLeadValidator = [
  body('clientName').optional().trim().notEmpty().isLength({ max: 150 }),
  body('company').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('mobile').optional().trim().notEmpty().isLength({ max: 20 }),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Enter a valid email'),
  body('location').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('businessCategory').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('serviceInterested').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('source').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('leadDate').optional({ values: 'falsy' }).isISO8601(),
  body('expectedValue').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  body('notes').optional({ values: 'null' }).trim(),
]

export const changeLeadStatusValidator = [
  body('status').isIn(LEAD_STATUSES).withMessage('Invalid lead status'),
  body('conversionValue').optional({ values: 'falsy' }).isFloat({ min: 0 }),
]

export const assignLeadValidator = [
  body('freelancerId')
    .exists()
    .withMessage('freelancerId is required (use null to unassign)')
    .custom((value) => value === null || (Number.isInteger(value) && value > 0))
    .withMessage('freelancerId must be a positive integer or null'),
  body('note').optional({ values: 'null' }).trim().isLength({ max: 255 }),
]

export const addActivityValidator = [
  body('activityType').isIn(ACTIVITY_TYPES).withMessage('Invalid activity type'),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 2000 }),
]

// Follow-ups

export const listFollowUpsValidator = [
  query('bucket').optional().isIn(['overdue', 'today', 'tomorrow', 'upcoming']),
  query('status').optional().isIn(['PENDING', 'COMPLETED', 'CANCELLED']),
  query('assignedFreelancerId').optional().isInt({ min: 1 }),
  query('followUpType').optional().isIn(FOLLOWUP_TYPES).withMessage('Invalid follow-up type'),
  query('priority').optional().isIn(FOLLOWUP_PRIORITIES).withMessage('Invalid priority'),
  query('search').optional().trim().isLength({ max: 150 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const createFollowUpValidator = [
  body('scheduledAt').isISO8601().withMessage('A valid scheduled date/time is required'),
  body('followUpType').isIn(FOLLOWUP_TYPES).withMessage('Invalid follow-up type'),
  body('priority').optional({ values: 'falsy' }).isIn(FOLLOWUP_PRIORITIES).withMessage('Invalid priority'),
  body('notes').optional({ values: 'null' }).trim(),
]

export const updateFollowUpValidator = [
  body('scheduledAt').optional().isISO8601(),
  body('followUpType').optional().isIn(FOLLOWUP_TYPES),
  body('priority').optional({ values: 'falsy' }).isIn(FOLLOWUP_PRIORITIES).withMessage('Invalid priority'),
  body('notes').optional({ values: 'null' }).trim(),
]

export const completeFollowUpValidator = [
  body('outcome').optional({ values: 'null' }).trim(),
  body('nextFollowUpDate').optional({ values: 'falsy' }).isISO8601(),
]
