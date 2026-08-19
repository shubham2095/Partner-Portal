import { pool } from '../config/database.js'

function parseSelectedQuestions(row) {
  if (!row) return row
  return {
    ...row,
    selected_questions:
      typeof row.selected_questions === 'string' ? JSON.parse(row.selected_questions) : row.selected_questions,
  }
}

export async function createAttempt({ testId, freelancerId, attemptNumber, selectedQuestions }, executor = pool) {
  const [result] = await executor.query(
    `INSERT INTO test_attempts (test_id, freelancer_id, attempt_number, selected_questions, status)
     VALUES (?, ?, ?, ?, 'NOT_STARTED')`,
    [testId, freelancerId, attemptNumber, JSON.stringify(selectedQuestions)]
  )
  return result.insertId
}

export async function findAttemptById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM test_attempts WHERE id = ? LIMIT 1', [id])
  return parseSelectedQuestions(rows[0]) ?? null
}

export async function findAttemptByIdForUpdate(id, connection) {
  const [rows] = await connection.query('SELECT * FROM test_attempts WHERE id = ? LIMIT 1 FOR UPDATE', [id])
  return parseSelectedQuestions(rows[0]) ?? null
}

export async function countAttemptsByFreelancerTest(testId, freelancerId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT COUNT(*) AS total FROM test_attempts WHERE test_id = ? AND freelancer_id = ?',
    [testId, freelancerId]
  )
  return rows[0].total
}

export async function findLatestAttempt(testId, freelancerId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT * FROM test_attempts WHERE test_id = ? AND freelancer_id = ?
     ORDER BY attempt_number DESC LIMIT 1`,
    [testId, freelancerId]
  )
  return parseSelectedQuestions(rows[0]) ?? null
}

export async function listAttemptsByFreelancer(freelancerId, { testId } = {}, executor = pool) {
  const conditions = ['ta.freelancer_id = ?']
  const params = [freelancerId]

  if (testId) {
    conditions.push('ta.test_id = ?')
    params.push(testId)
  }

  const [rows] = await executor.query(
    `SELECT ta.id, ta.test_id, ta.attempt_number, ta.status, ta.started_at, ta.submitted_at,
            ta.score, ta.percentage, ta.result, ta.time_used_seconds, t.title AS test_title
     FROM test_attempts ta
     JOIN tests t ON t.id = ta.test_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY ta.created_at DESC`,
    params
  )
  return rows
}

export async function listAttemptsForTest(
  { testId, freelancerId, result, status, page = 1, limit = 20 },
  executor = pool
) {
  const conditions = []
  const params = []

  if (testId) {
    conditions.push('ta.test_id = ?')
    params.push(testId)
  }

  if (freelancerId) {
    conditions.push('ta.freelancer_id = ?')
    params.push(freelancerId)
  }

  if (result) {
    conditions.push('ta.result = ?')
    params.push(result)
  }

  if (status) {
    conditions.push('ta.status = ?')
    params.push(status)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT ta.*, fp.full_name, fp.partner_id, t.title AS test_title
     FROM test_attempts ta
     JOIN freelancer_profiles fp ON fp.id = ta.freelancer_id
     JOIN tests t ON t.id = ta.test_id
     ${whereClause}
     ORDER BY ta.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const [countRows] = await executor.query(
    `SELECT COUNT(*) AS total
     FROM test_attempts ta
     JOIN freelancer_profiles fp ON fp.id = ta.freelancer_id
     JOIN tests t ON t.id = ta.test_id
     ${whereClause}`,
    params
  )

  return { rows: rows.map(parseSelectedQuestions), total: countRows[0].total }
}

export async function updateAttemptStart(id, { status, startedAt, expiresAt }, executor = pool) {
  await executor.query('UPDATE test_attempts SET status = ?, started_at = ?, expires_at = ? WHERE id = ?', [
    status,
    startedAt,
    expiresAt,
    id,
  ])
}

export async function updateAttemptStatus(id, status, executor = pool) {
  await executor.query('UPDATE test_attempts SET status = ? WHERE id = ?', [status, id])
}

export async function updateAttemptSubmission(
  id,
  { status, submittedAt, evaluatedAt, score, percentage, result, timeUsedSeconds },
  executor = pool
) {
  await executor.query(
    `UPDATE test_attempts
     SET status = ?, submitted_at = ?, evaluated_at = ?, score = ?, percentage = ?, result = ?, time_used_seconds = ?
     WHERE id = ?`,
    [status, submittedAt, evaluatedAt, score, percentage, result, timeUsedSeconds, id]
  )
}
