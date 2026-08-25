-- Mirrors the existing completed_at column so a cancelled follow-up records
-- when it was cancelled, the same way a completed one already records when
-- it was completed. Additive only — no existing column/index/FK touched.
ALTER TABLE follow_ups ADD COLUMN cancelled_at DATETIME NULL AFTER completed_at;
