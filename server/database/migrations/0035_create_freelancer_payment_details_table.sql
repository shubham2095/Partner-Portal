CREATE TABLE IF NOT EXISTS freelancer_payment_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  freelancer_id INT NOT NULL,
  account_holder_name VARCHAR(150) NULL,
  bank_account_number VARCHAR(50) NULL,
  ifsc_code VARCHAR(20) NULL,
  upi_id VARCHAR(100) NULL,
  pan_number VARCHAR(20) NULL,
  gst_number VARCHAR(30) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_freelancer_payment_details_freelancer_id (freelancer_id),
  CONSTRAINT fk_freelancer_payment_details_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
