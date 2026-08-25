ALTER TABLE commissions
  ADD COLUMN declaration_note VARCHAR(1000) NULL AFTER sale_value,
  ADD COLUMN supporting_document_path VARCHAR(500) NULL AFTER declaration_note,
  ADD COLUMN rejection_reason VARCHAR(500) NULL AFTER approved_at,
  MODIFY COLUMN status ENUM('POTENTIAL','EARNED','APPROVED','PAYABLE','PAID','REJECTED') NOT NULL DEFAULT 'POTENTIAL';
