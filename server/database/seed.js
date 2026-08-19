import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'
import { env } from '../config/env.js'
import { findUserByEmail, createUser } from '../models/userModel.js'

const email = process.env.SEED_ADMIN_EMAIL || 'admin@partnerportal.local'
const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'

async function run() {
  const existing = await findUserByEmail(email)
  if (existing) {
    console.log(`Admin account already exists for ${email}. Skipping seed.`)
    await pool.end()
    return
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds)
  const userId = await createUser({ email, passwordHash, role: 'SUPER_ADMIN' })

  console.log('Bootstrap admin account created:')
  console.log(`  id: ${userId}`)
  console.log(`  email: ${email}`)
  console.log(`  password: ${password}`)
  console.log('Log in and change this password as soon as possible.')

  await pool.end()
}

run().catch((error) => {
  console.error('Seeding failed:', error.message)
  process.exit(1)
})
