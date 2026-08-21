CREATE TABLE IF NOT EXISTS partner_level_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  freelancer_id INT NOT NULL,
  previous_level ENUM('STARTER','CERTIFIED_PARTNER','PREMIUM_PARTNER','ELITE_PARTNER') NULL,
  new_level ENUM('STARTER','CERTIFIED_PARTNER','PREMIUM_PARTNER','ELITE_PARTNER') NOT NULL,
  changed_by INT NOT NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_partner_level_history_freelancer_id (freelancer_id),
  CONSTRAINT fk_partner_level_history_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_partner_level_history_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
