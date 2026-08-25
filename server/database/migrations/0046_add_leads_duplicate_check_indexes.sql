-- Supports server-side duplicate-lead detection (exact phone/email match).
-- Non-unique indexes only: existing business rules allow legitimate shared
-- phone/email values (e.g. a shared office number), so no UNIQUE constraint
-- is added here — see leadDuplicateCheck.js for the documented rationale.
ALTER TABLE leads ADD INDEX idx_leads_mobile (mobile);
ALTER TABLE leads ADD INDEX idx_leads_email (email);
