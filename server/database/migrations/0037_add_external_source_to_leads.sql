ALTER TABLE leads
  ADD COLUMN external_source VARCHAR(50) NULL AFTER source,
  ADD COLUMN external_id VARCHAR(150) NULL AFTER external_source,
  ADD UNIQUE KEY uq_leads_external (external_source, external_id);
