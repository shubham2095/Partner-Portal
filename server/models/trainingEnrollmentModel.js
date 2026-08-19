import { pool } from '../config/database.js'

export async function findEnrollment(trainingId, freelancerId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM training_enrollments WHERE training_id = ? AND freelancer_id = ? LIMIT 1',
    [trainingId, freelancerId]
  )
  return rows[0] ?? null
}

export async function ensureEnrollment(trainingId, freelancerId, executor = pool) {
  await executor.query(
    `INSERT INTO training_enrollments (training_id, freelancer_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE last_accessed_at = CURRENT_TIMESTAMP`,
    [trainingId, freelancerId]
  )
  return findEnrollment(trainingId, freelancerId, executor)
}

export async function updateEnrollmentProgress(
  trainingId,
  freelancerId,
  { progressPercentage, status, completedAt },
  executor = pool
) {
  await executor.query(
    `UPDATE training_enrollments
     SET progress_percentage = ?, status = ?, completed_at = ?, last_accessed_at = CURRENT_TIMESTAMP
     WHERE training_id = ? AND freelancer_id = ?`,
    [progressPercentage, status, completedAt ?? null, trainingId, freelancerId]
  )
}

export async function listEnrollmentsByFreelancer(freelancerId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT te.*, t.title AS training_title, t.thumbnail_url AS training_thumbnail_url, t.total_lessons AS training_total_lessons
     FROM training_enrollments te
     INNER JOIN trainings t ON t.id = te.training_id
     WHERE te.freelancer_id = ?
     ORDER BY te.last_accessed_at DESC`,
    [freelancerId]
  )
  return rows
}
