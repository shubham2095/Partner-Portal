CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_user_id INT NOT NULL,
  type ENUM(
    'LEAD_ASSIGNED','LEAD_CONVERTED','COMMISSION_STATUS_CHANGED','PAYMENT_RECORDED',
    'WEBINAR_REGISTRATION_CONFIRMED','TRAINING_PUBLISHED','FOLLOWUP_REMINDER'
  ) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NULL,
  related_entity_type VARCHAR(50) NULL,
  related_entity_id INT NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_recipient_user_id (recipient_user_id),
  INDEX idx_notifications_read_at (read_at),
  CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
