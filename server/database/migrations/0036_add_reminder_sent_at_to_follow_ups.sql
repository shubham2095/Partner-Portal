ALTER TABLE follow_ups
  ADD COLUMN reminder_sent_at DATETIME NULL AFTER completed_at;
