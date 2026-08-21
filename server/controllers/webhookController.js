import { asyncHandler } from '../utils/asyncHandler.js'
import * as metaLeadAdsService from '../services/metaLeadAdsService.js'
import { processMetaWebhook, processGoogleWebhook } from '../services/webhookProcessingService.js'

// GET — Meta's one-time subscription verification handshake
export const verifyMetaSubscription = (req, res) => {
  const challenge = metaLeadAdsService.verifySubscriptionChallenge({
    mode: req.query['hub.mode'],
    verifyToken: req.query['hub.verify_token'],
    challenge: req.query['hub.challenge'],
  })

  if (challenge === null) {
    return res.status(403).send('Verification failed')
  }
  res.status(200).send(challenge)
}

// POST — actual leadgen webhook deliveries
export const handleMetaWebhook = asyncHandler(async (req, res) => {
  const signatureHeader = req.headers['x-hub-signature-256']
  const result = await processMetaWebhook(req.rawBody ?? Buffer.from(JSON.stringify(req.body)), signatureHeader)

  if (!result.accepted) {
    return res.status(403).json({ success: false, message: 'Webhook rejected', errors: {} })
  }
  // Meta expects a fast 200 regardless of downstream processing outcome.
  res.status(200).json({ success: true })
})

export const handleGoogleWebhook = asyncHandler(async (req, res) => {
  const result = await processGoogleWebhook(req.body)

  if (!result.accepted) {
    return res.status(403).json({ success: false, message: 'Webhook rejected', errors: {} })
  }
  res.status(200).json({ success: true })
})
