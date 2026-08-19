import { pool } from '../config/database.js'

export async function findWatchRecord(videoId, freelancerId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT * FROM video_watch_history WHERE video_id = ? AND freelancer_id = ? LIMIT 1',
    [videoId, freelancerId]
  )
  return rows[0] ?? null
}

export async function upsertWatchProgress(
  videoId,
  freelancerId,
  { lastPositionSeconds, watchedSeconds, isCompleted },
  executor = pool
) {
  await executor.query(
    `INSERT INTO video_watch_history
       (video_id, freelancer_id, last_position_seconds, watched_seconds, is_completed, last_watched_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       last_position_seconds = VALUES(last_position_seconds),
       watched_seconds = GREATEST(watched_seconds, VALUES(watched_seconds)),
       is_completed = IF(is_completed = 1, 1, VALUES(is_completed)),
       last_watched_at = CURRENT_TIMESTAMP`,
    [videoId, freelancerId, lastPositionSeconds, watchedSeconds, isCompleted ? 1 : 0]
  )
  return findWatchRecord(videoId, freelancerId, executor)
}
