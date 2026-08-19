import { param, query, body } from 'express-validator'

const CERTIFICATE_STATUSES = ['ACTIVE', 'REVOKED']

export const listCertificatesValidator = [
  query('status').optional().isIn(CERTIFICATE_STATUSES),
  query('search').optional().trim().isLength({ max: 150 }),
  query('freelancerId').optional().isInt({ min: 1 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
]

export const certificateIdParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid certificate id')]

export const revokeCertificateValidator = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('A revocation reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason must be 500 characters or fewer'),
]

export const certificateNumberParamValidator = [
  param('certificateNumber')
    .trim()
    .notEmpty()
    .matches(/^CERT-\d{4}-\d{6}$/)
    .withMessage('Invalid certificate number format'),
]
