import { ApiError } from '../utils/ApiError.js'
import {
  listConfigs,
  findConfigByProvider,
  upsertConfig,
} from '../models/integrationConfigModel.js'
import { listEvents } from '../models/webhookEventModel.js'
import { listLogs } from '../models/automationLogModel.js'
import { logAudit } from './auditService.js'

const PROVIDERS = [
  'META_LEAD_ADS',
  'GOOGLE_LEAD_FORMS',
  'WHATSAPP',
  'SMS',
  'RAZORPAY',
  'STRIPE',
  'S3',
  'AUTO_ASSIGNMENT',
]

export async function getConfigs() {
  return listConfigs()
}

export async function toggleConfig(provider, isEnabled, adminId, req) {
  if (!PROVIDERS.includes(provider)) {
    throw new ApiError(422, 'Unknown integration provider')
  }
  const before = await findConfigByProvider(provider)
  const config = await upsertConfig(provider, { isEnabled, updatedBy: adminId })

  await logAudit({
    actorId: adminId,
    action: 'INTEGRATION_CONFIG_CHANGED',
    entity: 'integration_config',
    entityId: config.id,
    oldValue: { isEnabled: Boolean(before?.is_enabled) },
    newValue: { isEnabled: Boolean(isEnabled) },
    req,
  })

  return config
}

export async function getWebhookEvents(query) {
  const { rows, total } = await listEvents(query)
  return { rows, total, page: query.page, limit: query.limit }
}

export async function getAutomationLogs(query) {
  const { rows, total } = await listLogs(query)
  return { rows, total, page: query.page, limit: query.limit }
}
