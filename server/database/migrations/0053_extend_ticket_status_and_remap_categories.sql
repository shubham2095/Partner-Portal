-- Status: ASSIGNED and WAITING_FOR_FREELANCER are new values added to the
-- existing enum. Every existing ticket's current status (OPEN, IN_PROGRESS,
-- RESOLVED, CLOSED) is still valid, so no data remapping is needed here.
ALTER TABLE tickets
  MODIFY COLUMN status ENUM('OPEN','ASSIGNED','IN_PROGRESS','WAITING_FOR_FREELANCER','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN';

-- Category: the PDF specifies a different (and smaller) label set than
-- Part 5's original categories, so existing rows are remapped to the closest
-- equivalent BEFORE the column's enum is narrowed, preserving every ticket.
ALTER TABLE tickets MODIFY COLUMN category VARCHAR(30) NOT NULL;

UPDATE tickets SET category = CASE category
  WHEN 'ACCOUNT' THEN 'PROFILE_ACCOUNT'
  WHEN 'LEADS' THEN 'LEAD_ISSUE'
  WHEN 'TRAINING' THEN 'COURSE_TRAINING'
  WHEN 'COMMISSION' THEN 'COMMISSION_ISSUE'
  WHEN 'WITHDRAWAL' THEN 'PAYMENT_WITHDRAWAL'
  WHEN 'PAYMENT' THEN 'PAYMENT_WITHDRAWAL'
  WHEN 'TECHNICAL' THEN 'TECHNICAL_ISSUE'
  WHEN 'OTHER' THEN 'GENERAL_QUERY'
  ELSE category
END;

ALTER TABLE tickets
  MODIFY COLUMN category ENUM('LEAD_ISSUE','COMMISSION_ISSUE','PAYMENT_WITHDRAWAL','COURSE_TRAINING','TECHNICAL_ISSUE','PROFILE_ACCOUNT','GENERAL_QUERY') NOT NULL DEFAULT 'GENERAL_QUERY';
