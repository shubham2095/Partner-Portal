CREATE TABLE IF NOT EXISTS webhook_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider ENUM('META_LEAD_ADS','GOOGLE_LEAD_FORMS') NOT NULL,
  external_event_id VARCHAR(191) NOT NULL,
  signature_valid TINYINT(1) NOT NULL DEFAULT 0,
  payload JSON NOT NULL,
  processing_status ENUM('RECEIVED','PROCESSED','REJECTED','DUPLICATE') NOT NULL DEFAULT 'RECEIVED',
  created_lead_id INT NULL,
  error_message TEXT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  UNIQUE KEY uq_webhook_events_provider_external_id (provider, external_event_id),
  INDEX idx_webhook_events_processing_status (processing_status),
  CONSTRAINT fk_webhook_events_created_lead FOREIGN KEY (created_lead_id) REFERENCES leads(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
