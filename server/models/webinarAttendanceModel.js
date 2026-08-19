import { pool } from '../config/database.js'

export async function upsertAttendance(
  { registrationId, attendanceStatus, markedBy, markedAt, joinTime = null, leaveTime = null, notes = null },
  executor = pool
) {
  await executor.query(
    `INSERT INTO webinar_attendance (registration_id, attendance_status, marked_by, marked_at, join_time, leave_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       attendance_status = VALUES(attendance_status),
       marked_by = VALUES(marked_by),
       marked_at = VALUES(marked_at),
       join_time = VALUES(join_time),
       leave_time = VALUES(leave_time),
       notes = VALUES(notes)`,
    [registrationId, attendanceStatus, markedBy, markedAt, joinTime, leaveTime, notes]
  )
}

export async function findAttendanceByRegistrationId(registrationId, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM webinar_attendance WHERE registration_id = ? LIMIT 1', [
    registrationId,
  ])
  return rows[0] ?? null
}
