import { body } from 'express-validator'

const DOCUMENT_TYPES = ['ID_PROOF', 'ADDRESS_PROOF', 'PAN_CARD', 'BANK_PROOF', 'OTHER']

export const updateProfessionalDetailsValidator = [
  body('fullName').optional().trim().isLength({ max: 150 }).withMessage('Full name must be 150 characters or fewer'),
  body('mobile')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage('Enter a valid mobile number'),
  body('location').optional().trim().isLength({ max: 150 }).withMessage('Location must be 150 characters or fewer'),
  body('dateOfBirth').optional({ values: 'null' }).isISO8601().withMessage('Enter a valid date of birth'),
  body('currentOccupation')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Current occupation must be 150 characters or fewer'),
  body('totalExperienceYears')
    .optional()
    .isFloat({ min: 0, max: 99.9 })
    .withMessage('Enter a valid number of years of experience'),
  body('digitalMarketingExperience').optional().trim(),
  body('salesExperience').optional().trim(),
  body('skills').optional().trim(),
  body('specializations').optional().trim(),
  body('preferredWorkingAreas').optional().trim(),
  body('previousAgencyExperience').optional().trim(),
]

export const uploadDocumentValidator = [
  body('documentType')
    .trim()
    .notEmpty()
    .withMessage('Document type is required')
    .isIn(DOCUMENT_TYPES)
    .withMessage(`Document type must be one of: ${DOCUMENT_TYPES.join(', ')}`),
]
