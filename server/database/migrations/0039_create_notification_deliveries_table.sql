CREATE TABLE IF NOT EXISTS notification_deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notification_id INT NOT NULL,
  channel ENUM('EMAIL','WHATSAPP','SMS') NOT NULL,
  status ENUM('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  provider_response TEXT NULL,
  error_message TEXT NULL,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME NULL,
  INDEX idx_notification_deliveries_notification_id (notification_id),
  CONSTRAINT fk_notification_deliveries_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
