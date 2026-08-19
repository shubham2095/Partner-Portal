CREATE TABLE IF NOT EXISTS training_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  material_type ENUM('PDF','PPT','DOC','IMAGE','OTHER') NOT NULL DEFAULT 'OTHER',
  file_path VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NULL,
  mime_type VARCHAR(100) NULL,
  file_size INT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_training_materials_lesson_id (lesson_id),
  CONSTRAINT fk_training_materials_lesson FOREIGN KEY (lesson_id) REFERENCES training_lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_training_materials_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
