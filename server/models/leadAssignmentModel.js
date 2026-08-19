import { pool } from '../config/database.js'

export async function createAssignment(
  { leadId, freelancerId, previousFreelancerId, assignedBy, assignmentNote },
  executor = pool
) {
  const [result] = await executor.query(
    `INSERT INTO lead_assignments (lead_id, freelancer_id, previous_freelancer_id, assigned_by, assignment_note)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, freelancerId ?? null, previousFreelancerId ?? null, assignedBy, assignmentNote ?? null]
  )
  return result.insertId
}

export async function listAssignmentsByLead(leadId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT la.*, fp.full_name AS freelancer_name, prev.full_name AS previous_freelancer_name, u.email AS assigned_by_email
     FROM lead_assignments la
     LEFT JOIN freelancer_profiles fp ON fp.id = la.freelancer_id
     LEFT JOIN freelancer_profiles prev ON prev.id = la.previous_freelancer_id
     LEFT JOIN users u ON u.id = la.assigned_by
     WHERE la.lead_id = ?
     ORDER BY la.created_at DESC`,
    [leadId]
  )
  return rows
}
