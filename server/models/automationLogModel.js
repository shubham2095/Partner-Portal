import { pool } from '../config/database.js'

export async function createLog(
  { jobName, recordsProcessed, recordsSucceeded, recordsFailed, details },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO automation_logs (job_name, records_processed, records_succeeded, records_failed, details)
     VALUES (?, ?, ?, ?, ?)`,
    [jobName, recordsProcessed ?? 0, recordsSucceeded ?? 0, recordsFailed ?? 0, details ? JSON.stringify(details) : null]
  )
  return result.insertId
}

export async function listLogs({ jobName, page = 1, limit = 20 }, executor = pool) {
  const conditions = []
  const params = []
  if (jobName) {
    conditions.push('job_name = ?')
    params.push(jobName)
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [rows] = await executor.query(
    `SELECT * FROM automation_logs ${whereClause} ORDER BY run_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [countRows] = await executor.query(`SELECT COUNT(*) AS total FROM automation_logs ${whereClause}`, params)
  return { rows, total: countRows[0].total }
}
