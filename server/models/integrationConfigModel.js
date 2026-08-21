import { pool } from '../config/database.js'

export async function listConfigs(executor = pool) {
  const [rows] = await executor.query('SELECT * FROM integration_configs ORDER BY provider ASC')
  return rows
}

export async function findConfigByProvider(provider, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM integration_configs WHERE provider = ? LIMIT 1', [provider])
  return rows[0] ?? null
}

export async function upsertConfig(provider, { isEnabled, configJson, updatedBy }, executor = pool) {
  await executor.query(
    `INSERT INTO integration_configs (provider, is_enabled, config_json, updated_by)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       is_enabled = VALUES(is_enabled),
       config_json = COALESCE(VALUES(config_json), config_json),
       updated_by = VALUES(updated_by)`,
    [provider, isEnabled ? 1 : 0, configJson ? JSON.stringify(configJson) : null, updatedBy ?? null]
  )
  return findConfigByProvider(provider, executor)
}

export async function isProviderEnabled(provider, executor = pool) {
  const config = await findConfigByProvider(provider, executor)
  return Boolean(config?.is_enabled)
}
