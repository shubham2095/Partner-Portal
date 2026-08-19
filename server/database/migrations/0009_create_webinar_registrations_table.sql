CREATE TABLE IF NOT EXISTS webinar_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  webinar_id INT NOT NULL,
  freelancer_id INT NOT NULL,
  registration_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('REGISTERED','ATTENDED','ABSENT','CANCELLED') NOT NULL DEFAULT 'REGISTERED',
  source VARCHAR(100) NULL,
  campaign VARCHAR(150) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_webinar_registrations_webinar_freelancer (webinar_id, freelancer_id),
  INDEX idx_webinar_registrations_freelancer (freelancer_id),
  INDEX idx_webinar_registrations_status (status),
  CONSTRAINT fk_webinar_registrations_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE,
  CONSTRAINT fk_webinar_registrations_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
