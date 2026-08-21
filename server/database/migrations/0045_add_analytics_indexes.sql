-- Phase 7 analytics queries group/filter by these date and activity-type
-- columns on large, growing tables; none of them were indexed previously.
ALTER TABLE leads ADD INDEX idx_leads_created_at (created_at);
ALTER TABLE commissions ADD INDEX idx_commissions_created_at (created_at);
ALTER TABLE lead_activities ADD INDEX idx_lead_activities_type_created (activity_type, created_at);
