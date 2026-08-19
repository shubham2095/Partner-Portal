CREATE TABLE IF NOT EXISTS training_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  training_id INT NOT NULL,
  freelancer_id INT NOT NULL,
  status ENUM('IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
  progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_training_enrollments_training_freelancer (training_id, freelancer_id),
  INDEX idx_training_enrollments_freelancer_id (freelancer_id),
  CONSTRAINT fk_training_enrollments_training FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
  CONSTRAINT fk_training_enrollments_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
