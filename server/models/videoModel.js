import { pool } from '../config/database.js'

export async function createVideo(
  { lessonId, title, description, videoUrl, thumbnailUrl, durationSeconds, displayOrder, createdBy },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO videos (lesson_id, title, description, video_url, thumbnail_url, duration_seconds, display_order, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lessonId,
      title,
      description ?? null,
      videoUrl,
      thumbnailUrl ?? null,
      durationSeconds ?? null,
      displayOrder ?? 0,
      createdBy,
    ]
  )
  return result.insertId
}

export async function findVideoById(id, executor = pool) {
  const [rows] = await executor.query('SELECT * FROM videos WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

const VIDEO_FIELDS = ['title', 'description', 'video_url', 'thumbnail_url', 'duration_seconds', 'display_order']

export async function updateVideo(id, fields, executor = pool) {
  const entries = Object.entries(fields).filter(([key, value]) => VIDEO_FIELDS.includes(key) && value !== undefined)
  if (entries.length === 0) return
  const setClause = entries.map(([key]) => `${key} = ?`).join(', ')
  const values = entries.map(([, value]) => value)
  await executor.query(`UPDATE videos SET ${setClause} WHERE id = ?`, [...values, id])
}

export async function deleteVideo(id, executor = pool) {
  await executor.query('DELETE FROM videos WHERE id = ?', [id])
}

export async function listVideosByLesson(lessonId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM videos WHERE lesson_id = ? ORDER BY display_order ASC, id ASC',
    [lessonId]
  )
  return rows
}

export async function findVideoWithTraining(id, executor = pool) {
  const [rows] = await executor.query(
    `SELECT v.*, tm.training_id AS training_id
     FROM videos v
     INNER JOIN training_lessons tl ON tl.id = v.lesson_id
     INNER JOIN training_modules tm ON tm.id = tl.module_id
     WHERE v.id = ? LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}
