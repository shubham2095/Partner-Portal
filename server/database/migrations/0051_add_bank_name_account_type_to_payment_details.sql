ALTER TABLE freelancer_payment_details
  ADD COLUMN bank_name VARCHAR(150) NULL AFTER account_holder_name,
  ADD COLUMN account_type ENUM('SAVINGS','CURRENT') NULL AFTER bank_account_number;
