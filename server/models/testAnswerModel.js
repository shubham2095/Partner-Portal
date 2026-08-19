import { pool } from '../config/database.js'

export async function upsertAnswer({ attemptId, questionId, selectedAnswer, answeredAt }, executor = pool) {
  await executor.query(
    `INSERT INTO test_answers (attempt_id, question_id, selected_answer, answered_at)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE selected_answer = VALUES(selected_answer), answered_at = VALUES(answered_at)`,
    [attemptId, questionId, selectedAnswer ?? null, answeredAt]
  )
}

export async function listAnswersByAttempt(attemptId, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM test_answers WHERE attempt_id = ?', [attemptId])
  return rows
}

export async function updateAnswerEvaluation(id, { isCorrect, marksAwarded }, executor = pool) {
  await executor.query('UPDATE test_answers SET is_correct = ?, marks_awarded = ? WHERE id = ?', [
    isCorrect ? 1 : 0,
    marksAwarded,
    id,
  ])
}
