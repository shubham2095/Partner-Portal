CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commission_id INT NOT NULL,
  freelancer_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  transaction_reference VARCHAR(150) NULL,
  payment_proof_path VARCHAR(500) NULL,
  processed_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payments_commission_id (commission_id),
  INDEX idx_payments_freelancer_id (freelancer_id),
  CONSTRAINT fk_payments_commission FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_processed_by FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
