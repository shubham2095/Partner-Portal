CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  freelancer_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED','PAID') NOT NULL DEFAULT 'PENDING',
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  rejection_reason VARCHAR(500) NULL,
  transaction_reference VARCHAR(150) NULL,
  paid_at DATETIME NULL,
  admin_note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_withdrawal_requests_freelancer_id (freelancer_id),
  INDEX idx_withdrawal_requests_status (status),
  CONSTRAINT fk_withdrawal_requests_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_withdrawal_requests_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A commission reserved by a withdrawal request is excluded from the
-- freelancer's available-for-withdrawal balance for as long as this is set
-- (PENDING/APPROVED = reserved, PAID = permanently consumed). Rejecting a
-- withdrawal clears this back to NULL, returning the commission to the pool.
ALTER TABLE commissions
  ADD COLUMN withdrawal_request_id INT NULL AFTER status,
  ADD CONSTRAINT fk_commissions_withdrawal_request FOREIGN KEY (withdrawal_request_id) REFERENCES withdrawal_requests(id) ON DELETE SET NULL,
  ADD INDEX idx_commissions_withdrawal_request_id (withdrawal_request_id);
