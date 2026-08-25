import { pool } from '../config/database.js'

export async function createUser({ email, passwordHash, role }, executor = pool) {
  const [result] = await executor.query(
    'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
    [email, passwordHash, role]
  )
  return result.insertId
}

export async function findUserByEmail(email, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
  return rows[0] ?? null
}

export async function findUserById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function updateLastLogin(id, executor = pool) {
  await executor.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id])
}

export async function setEmailVerified(id, executor = pool) {
  await executor.query('UPDATE users SET email_verified_at = NOW() WHERE id = ?', [id])
}

export async function setUserActiveStatus(id, isActive, executor = pool) {
  await executor.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id])
}

export async function updatePasswordHash(id, passwordHash, executor = pool) {
  await executor.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id])
}

export async function listAdminUsers(executor = pool) {
  const [rows] = await executor.query(
    "SELECT id, email, role FROM users WHERE role IN ('ADMIN','SUPER_ADMIN') AND is_active = 1 ORDER BY email ASC"
  )
  return rows
}
