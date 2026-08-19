import { pool } from '../config/database.js'

export async function addQuestionToTest({ testId, questionId, displayOrder }, executor = pool) {
  const [result] = await executor.query(
    'INSERT INTO test_questions (test_id, question_id, display_order) VALUES (?, ?, ?)',
    [testId, questionId, displayOrder ?? 0]
  )
  return result.insertId
}

export async function removeQuestionFromTest(testId, questionId, executor = pool) {
  await executor.query('DELETE FROM test_questions WHERE test_id = ? AND question_id = ?', [testId, questionId])
}

export async function findTestQuestion(testId, questionId, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM test_questions WHERE test_id = ? AND question_id = ? LIMIT 1', [
    testId,
    questionId,
  ])
  return rows[0] ?? null
}

export async function listQuestionsForTest(testId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT q.*, tq.display_order
     FROM test_questions tq
     JOIN questions q ON q.id = tq.question_id
     WHERE tq.test_id = ?
     ORDER BY tq.display_order ASC, tq.id ASC`,
    [testId]
  )
  return rows.map((row) => ({ ...row, options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options }))
}

export async function reorderTestQuestions(testId, orderedQuestionIds, executor = pool) {
  for (let index = 0; index < orderedQuestionIds.length; index += 1) {
    await executor.query('UPDATE test_questions SET display_order = ? WHERE test_id = ? AND question_id = ?', [
      index,
      testId,
      orderedQuestionIds[index],
    ])
  }
}

export async function countQuestionsForTest(testId, executor = pool) {
  const [rows] = await executor.query('SELECT COUNT(*) AS total FROM test_questions WHERE test_id = ?', [testId])
  return rows[0].total
}
