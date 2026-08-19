import { pool } from '../config/database.js'

export async function findLessonProgress(lessonId, freelancerId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM lesson_progress WHERE lesson_id = ? AND freelancer_id = ? LIMIT 1',
    [lessonId, freelancerId]
  )
  return rows[0] ?? null
}

export async function touchLessonProgress(lessonId, freelancerId, executor = pool) {
  await executor.query(
    `INSERT INTO lesson_progress (lesson_id, freelancer_id, status)
     VALUES (?, ?, 'IN_PROGRESS')
     ON DUPLICATE KEY UPDATE
       status = IF(status = 'COMPLETED', status, 'IN_PROGRESS'),
       last_accessed_at = CURRENT_TIMESTAMP`,
    [lessonId, freelancerId]
  )
}

export async function markLessonCompleted(lessonId, freelancerId, executor = pool) {
  await executor.query(
    `INSERT INTO lesson_progress (lesson_id, freelancer_id, status, completed_at)
     VALUES (?, ?, 'COMPLETED', CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       status = 'COMPLETED',
       completed_at = IFNULL(completed_at, CURRENT_TIMESTAMP),
       last_accessed_at = CURRENT_TIMESTAMP`,
    [lessonId, freelancerId]
  )
}

export async function listProgressByTrainingAndFreelancer(trainingId, freelancerId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT lp.*
     FROM lesson_progress lp
     INNER JOIN training_lessons tl ON tl.id = lp.lesson_id
     INNER JOIN training_modules tm ON tm.id = tl.module_id
     WHERE tm.training_id = ? AND lp.freelancer_id = ?`,
    [trainingId, freelancerId]
  )
  return rows
}

export async function countCompletedLessons(trainingId, freelancerId, executor = pool) {
  const [[row]] = await executor.query(
    `SELECT COUNT(*) AS count
     FROM lesson_progress lp
     INNER JOIN training_lessons tl ON tl.id = lp.lesson_id
     INNER JOIN training_modules tm ON tm.id = tl.module_id
     WHERE tm.training_id = ? AND lp.freelancer_id = ? AND lp.status = 'COMPLETED'`,
    [trainingId, freelancerId]
  )
  return row.count
}
