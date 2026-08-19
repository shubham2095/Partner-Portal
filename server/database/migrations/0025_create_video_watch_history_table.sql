CREATE TABLE IF NOT EXISTS video_watch_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id INT NOT NULL,
  freelancer_id INT NOT NULL,
  last_position_seconds INT NOT NULL DEFAULT 0,
  watched_seconds INT NOT NULL DEFAULT 0,
  is_completed TINYINT(1) NOT NULL DEFAULT 0,
  last_watched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_video_watch_history_video_freelancer (video_id, freelancer_id),
  INDEX idx_video_watch_history_freelancer_id (freelancer_id),
  CONSTRAINT fk_video_watch_history_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  CONSTRAINT fk_video_watch_history_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
