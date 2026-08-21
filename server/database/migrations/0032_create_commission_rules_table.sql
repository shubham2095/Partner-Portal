CREATE TABLE IF NOT EXISTS commission_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_name VARCHAR(150) NOT NULL,
  rate_type ENUM('PERCENTAGE','FIXED') NOT NULL DEFAULT 'PERCENTAGE',
  rate_value DECIMAL(10,2) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_commission_rules_service_name (service_name),
  INDEX idx_commission_rules_status (status),
  CONSTRAINT fk_commission_rules_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
