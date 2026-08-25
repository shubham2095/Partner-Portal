-- Part 7 fix: the duplicate-lead check (leadModel.findDuplicateLeadCandidates)
-- wraps mobile/email in SQL functions in its WHERE clause (RIGHT(REPLACE(...)),
-- LOWER(TRIM(...))), which no index on the raw columns can support (confirmed
-- via EXPLAIN: possible_keys NULL, full-index-order scan). Combined with the
-- "SELECT ... FOR UPDATE" used to close the check-then-insert race window,
-- this locks its way through every row (and gap) in the leads table on every
-- single lead creation, which deadlocks under concurrent inserts and only
-- gets worse as the table grows.
--
-- Fix: materialize the same normalization logic as stored generated columns
-- and index them, so the duplicate-check query becomes a sargable equality
-- lookup — FOR UPDATE then only locks the handful of actually-matching rows
-- (typically zero or one), not the whole table. The generated-column
-- expressions are the exact same logic already used inline, so matching
-- behavior is unchanged — only the locking footprint shrinks.
ALTER TABLE leads
  ADD COLUMN normalized_mobile VARCHAR(10)
    GENERATED ALWAYS AS (
      RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(mobile, ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''), 10)
    ) STORED,
  ADD COLUMN normalized_email VARCHAR(255)
    GENERATED ALWAYS AS (LOWER(TRIM(email))) STORED,
  ADD INDEX idx_leads_normalized_mobile (normalized_mobile),
  ADD INDEX idx_leads_normalized_email (normalized_email);
