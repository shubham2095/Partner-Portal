-- Existing types are preserved (VIDEO_CALL, SITE_VISIT) — DEMO and OTHER are
-- added alongside them, not a replacement, so no existing follow_ups row
-- ever needs remapping.
ALTER TABLE follow_ups
  MODIFY COLUMN follow_up_type ENUM('PHONE_CALL','WHATSAPP','EMAIL','MEETING','VIDEO_CALL','SITE_VISIT','DEMO','OTHER') NOT NULL,
  ADD COLUMN priority ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM' AFTER follow_up_type;
