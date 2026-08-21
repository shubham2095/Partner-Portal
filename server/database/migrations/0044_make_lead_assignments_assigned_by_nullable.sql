-- Phase 4's lead_assignments.assigned_by assumed a human admin always
-- performs the assignment. Phase 6 introduces system/round-robin
-- auto-assignment for externally-sourced leads, which has no human actor —
-- mirrors the existing nullable lead_activities.actor_id for the same reason.
ALTER TABLE lead_assignments
  MODIFY COLUMN assigned_by INT NULL;
