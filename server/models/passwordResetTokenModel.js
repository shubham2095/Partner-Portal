import { pool } from '../config/database.js'

export async function createPasswordResetToken({ userId, token, expiresAt }, executor = pool) {
  const [result] = await executor.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  )
  return result.insertId
}

export async function findValidPasswordResetToken(token, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1',
    [token]
  )
  return rows[0] ?? null
}

export async function markPasswordResetTokenUsed(id, executor = pool) {
  await executor.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [id])
}

export async function invalidatePasswordResetTokensForUser(userId, executor = pool) {
  await executor.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
    [userId]
  )
}
