CREATE TABLE IF NOT EXISTS lead_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  freelancer_id INT NULL,
  previous_freelancer_id INT NULL,
  assigned_by INT NOT NULL,
  assignment_note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lead_assignments_lead_id (lead_id),
  INDEX idx_lead_assignments_freelancer_id (freelancer_id),
  CONSTRAINT fk_lead_assignments_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead_assignments_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_lead_assignments_previous_freelancer FOREIGN KEY (previous_freelancer_id) REFERENCES freelancer_profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_lead_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
