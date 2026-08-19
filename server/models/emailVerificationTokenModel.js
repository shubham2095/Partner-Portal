import { pool } from '../config/database.js'

export async function createEmailVerificationToken({ userId, token, expiresAt }, executor = pool) {
  const [result] = await executor.query(
    'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  )
  return result.insertId
}

export async function findValidEmailVerificationToken(token, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM email_verification_tokens WHERE token = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1',
    [token]
  )
  return rows[0] ?? null
}

export async function markEmailVerificationTokenUsed(id, executor = pool) {
  await executor.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?', [id])
}

export async function invalidateEmailVerificationTokensForUser(userId, executor = pool) {
  await executor.query(
    'UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
    [userId]
  )
}
