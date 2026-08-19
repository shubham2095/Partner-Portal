CREATE TABLE IF NOT EXISTS training_lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  lesson_type ENUM('VIDEO','MATERIAL') NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  duration_minutes INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_training_lessons_module_id (module_id),
  CONSTRAINT fk_training_lessons_module FOREIGN KEY (module_id) REFERENCES training_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
