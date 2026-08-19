import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import * as verificationService from '../services/verificationService.js'

export const verifyCertificate = asyncHandler(async (req, res) => {
  const result = await verificationService.verifyCertificate(req.params.certificateNumber)
  sendSuccess(res, { message: 'Certificate verification result', data: result })
})
