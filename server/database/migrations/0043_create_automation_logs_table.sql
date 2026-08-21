CREATE TABLE IF NOT EXISTS automation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  records_processed INT NOT NULL DEFAULT 0,
  records_succeeded INT NOT NULL DEFAULT 0,
  records_failed INT NOT NULL DEFAULT 0,
  details JSON NULL,
  INDEX idx_automation_logs_job_name (job_name),
  INDEX idx_automation_logs_run_at (run_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
