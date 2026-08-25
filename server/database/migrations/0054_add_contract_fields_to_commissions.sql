-- Client payment confirmation is tracked as a distinct, explicit admin
-- action — it is never inferred from the lead's CONVERTED status. Approving
-- a commission (server-enforced, see adminCommissionService) requires this
-- to be set first, threading "Client Payment Received" into the lifecycle
-- as a real gate rather than a renamed status.
ALTER TABLE commissions
  ADD COLUMN client_payment_received_at DATETIME NULL AFTER supporting_document_path,
  ADD COLUMN client_payment_confirmed_by INT NULL AFTER client_payment_received_at,
  ADD COLUMN terms_accepted TINYINT(1) NOT NULL DEFAULT 0 AFTER declaration_note,
  ADD COLUMN deal_closing_date DATE NULL AFTER terms_accepted,
  ADD COLUMN contract_document_path VARCHAR(500) NULL AFTER rejection_reason,
  ADD CONSTRAINT fk_commissions_client_payment_confirmed_by FOREIGN KEY (client_payment_confirmed_by) REFERENCES users(id) ON DELETE SET NULL;
