CREATE TABLE IF NOT EXISTS follow_ups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  follow_up_type ENUM('PHONE_CALL','WHATSAPP','EMAIL','MEETING','VIDEO_CALL','SITE_VISIT') NOT NULL,
  notes TEXT NULL,
  outcome TEXT NULL,
  next_follow_up_date DATETIME NULL,
  status ENUM('PENDING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_by INT NOT NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_follow_ups_lead_id (lead_id),
  INDEX idx_follow_ups_scheduled_at (scheduled_at),
  INDEX idx_follow_ups_status (status),
  CONSTRAINT fk_follow_ups_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_follow_ups_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
