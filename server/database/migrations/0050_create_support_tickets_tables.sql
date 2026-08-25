CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(20) NULL,
  freelancer_id INT NOT NULL,
  category ENUM('ACCOUNT','LEADS','TRAINING','COMMISSION','WITHDRAWAL','PAYMENT','TECHNICAL','OTHER') NOT NULL DEFAULT 'OTHER',
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  status ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  assigned_admin_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  closed_at DATETIME NULL,
  UNIQUE KEY uq_tickets_ticket_number (ticket_number),
  INDEX idx_tickets_freelancer_id (freelancer_id),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_priority (priority),
  INDEX idx_tickets_assigned_admin_id (assigned_admin_id),
  CONSTRAINT fk_tickets_freelancer FOREIGN KEY (freelancer_id) REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_assigned_admin FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  sender_user_id INT NOT NULL,
  sender_role ENUM('FREELANCER','ADMIN') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ticket_messages_ticket_id (ticket_id),
  CONSTRAINT fk_ticket_messages_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_messages_sender FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- An attachment with message_id NULL belongs to the ticket itself (the
-- original attachment submitted with ticket creation); one with message_id
-- set belongs to that specific reply. One optional file per action, matching
-- the single-proof-file convention already used for payments/deal documents.
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  message_id INT NULL,
  uploaded_by INT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  file_size INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_attachments_ticket_id (ticket_id),
  CONSTRAINT fk_ticket_attachments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_attachments_message FOREIGN KEY (message_id) REFERENCES ticket_messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_attachments_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket events reuse the existing notification architecture; four new
-- types cover every Phase 10 event without one-type-per-event bloat
-- (TICKET_REPLIED covers both directions, TICKET_STATUS_CHANGED covers
-- resolved/closed/reopened).
ALTER TABLE notifications MODIFY COLUMN type ENUM(
  'LEAD_ASSIGNED','LEAD_CONVERTED','COMMISSION_STATUS_CHANGED','PAYMENT_RECORDED',
  'WEBINAR_REGISTRATION_CONFIRMED','TRAINING_PUBLISHED','FOLLOWUP_REMINDER',
  'TICKET_CREATED','TICKET_ASSIGNED','TICKET_REPLIED','TICKET_STATUS_CHANGED'
) NOT NULL;
