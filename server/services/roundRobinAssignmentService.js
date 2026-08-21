import { pool } from '../config/database.js'

/**
 * Picks the ACTIVE freelancer with the fewest externally-sourced leads
 * assigned so far (ties broken by whoever was assigned longest ago, or
 * never assigned). This is the only automatic-distribution rule
 * implemented for Phase 6 — location/expertise/availability/performance/
 * capacity/partner-level weighting are not implemented because none of
 * the six specification files define concrete thresholds or weights for
 * them; implementing those would mean inventing business rules.
 */
export async function pickNextFreelancer(executor = pool) {
  const [rows] = await executor.query(
    `SELECT fp.id
     FROM freelancer_profiles fp
     LEFT JOIN (
       SELECT assigned_freelancer_id, MAX(created_at) AS last_assigned_at, COUNT(*) AS assigned_count
       FROM leads
       WHERE external_source IS NOT NULL AND assigned_freelancer_id IS NOT NULL
       GROUP BY assigned_freelancer_id
     ) stats ON stats.assigned_freelancer_id = fp.id
     WHERE fp.status = 'ACTIVE'
     ORDER BY COALESCE(stats.assigned_count, 0) ASC, COALESCE(stats.last_assigned_at, '1970-01-01 00:00:00') ASC
     LIMIT 1`
  )
  return rows[0]?.id ?? null
}
