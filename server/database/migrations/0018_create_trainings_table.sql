CREATE TABLE IF NOT EXISTS trainings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  thumbnail_url VARCHAR(500) NULL,
  access_level ENUM('ALL','VERIFIED','QUALIFIED','CERTIFIED','ACTIVE') NOT NULL DEFAULT 'ALL',
  status ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  total_modules INT NOT NULL DEFAULT 0,
  total_lessons INT NOT NULL DEFAULT 0,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_trainings_status (status),
  INDEX idx_trainings_category_id (category_id),
  INDEX idx_trainings_access_level (access_level),
  CONSTRAINT fk_trainings_category FOREIGN KEY (category_id) REFERENCES training_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_trainings_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
