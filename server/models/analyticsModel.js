import { pool } from '../config/database.js'
import { toMysqlDate } from '../utils/dateRange.js'

// ---- Admin overview (top metrics) ----

export async function getAdminOverview(executor = pool) {
  const [[freelancerCounts]] = await executor.query(`
    SELECT
      COUNT(*) AS total_freelancers,
      SUM(status = 'ACTIVE') AS active_freelancers,
      SUM(status = 'CERTIFIED') AS certified_freelancers,
      SUM(status IN ('PENDING','VERIFIED')) AS pending_qualification,
      SUM(status IN ('SUSPENDED','INACTIVE','REJECTED')) AS inactive_freelancers
    FROM freelancer_profiles
  `)

  const [[leadCounts]] = await executor.query(`
    SELECT
      COUNT(*) AS total_leads,
      SUM(assigned_freelancer_id IS NULL) AS unassigned_leads,
      SUM(assigned_freelancer_id IS NOT NULL AND status NOT IN ('CONVERTED','LOST','NOT_INTERESTED','WRONG_NUMBER')) AS active_leads,
      SUM(status = 'CONVERTED') AS converted_leads,
      SUM(status IN ('LOST','NOT_INTERESTED','WRONG_NUMBER')) AS lost_leads,
      COALESCE(SUM(CASE WHEN status = 'CONVERTED' THEN conversion_value ELSE 0 END), 0) AS revenue
    FROM leads
  `)

  const [[commissionCounts]] = await executor.query(`
    SELECT
      COALESCE(SUM(CASE WHEN status IN ('APPROVED','PAYABLE') THEN commission_amount ELSE 0 END), 0) AS commission_payable,
      COALESCE(SUM(CASE WHEN status = 'PAID' THEN commission_amount ELSE 0 END), 0) AS commission_paid,
      COALESCE(SUM(CASE WHEN status != 'PAID' THEN commission_amount ELSE 0 END), 0) AS outstanding_commission
    FROM commissions
  `)

  return {
    totalFreelancers: Number(freelancerCounts.total_freelancers),
    activeFreelancers: Number(freelancerCounts.active_freelancers),
    certifiedFreelancers: Number(freelancerCounts.certified_freelancers),
    pendingQualification: Number(freelancerCounts.pending_qualification),
    inactiveFreelancers: Number(freelancerCounts.inactive_freelancers),
    totalLeads: Number(leadCounts.total_leads),
    unassignedLeads: Number(leadCounts.unassigned_leads),
    assignedLeads: Number(leadCounts.total_leads) - Number(leadCounts.unassigned_leads),
    activeLeads: Number(leadCounts.active_leads),
    convertedLeads: Number(leadCounts.converted_leads),
    lostLeads: Number(leadCounts.lost_leads),
    totalSales: Number(leadCounts.converted_leads),
    revenue: Number(leadCounts.revenue),
    commissionPayable: Number(commissionCounts.commission_payable),
    commissionPaid: Number(commissionCounts.commission_paid),
    outstandingCommission: Number(commissionCounts.outstanding_commission),
  }
}

// ---- Leads over time ----

export async function getLeadsOverTime(from, to, executor = pool) {
  const [rows] = await executor.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count
     FROM leads
     WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [toMysqlDate(from), toMysqlDate(to)]
  )
  return rows
}

// ---- Conversion funnel (current status distribution) ----

const FUNNEL_STAGES = [
  'NEW',
  'CONTACT_ATTEMPTED',
  'CONTACTED',
  'INTERESTED',
  'MEETING_SCHEDULED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'FOLLOW_UP',
  'CONVERTED',
]

export async function getConversionFunnel(executor = pool) {
  const [rows] = await executor.query(
    `SELECT status, COUNT(*) AS count FROM leads WHERE status IN (${FUNNEL_STAGES.map(() => '?').join(',')}) GROUP BY status`,
    FUNNEL_STAGES
  )
  const byStatus = new Map(rows.map((row) => [row.status, Number(row.count)]))
  return FUNNEL_STAGES.map((stage) => ({ stage, count: byStatus.get(stage) ?? 0 }))
}

// ---- Revenue trend (based on the CONVERTED activity event date, not updated_at) ----

export async function getRevenueTrend(from, to, executor = pool) {
  // Uses the CONVERTED activity event for an accurate conversion date
  // (lead.updated_at would drift on unrelated edits), but only counts a
  // lead whose CURRENT status is still CONVERTED — otherwise a lead an
  // admin later reverted (see leadStatusService's terminal-override
  // capability) would keep inflating this trend forever while correctly
  // dropping out of the "revenue" overview total, making the two
  // permanently disagree.
  const [rows] = await executor.query(
    `SELECT DATE(la.created_at) AS date, COALESCE(SUM(l.conversion_value), 0) AS revenue
     FROM lead_activities la
     INNER JOIN leads l ON l.id = la.lead_id
     WHERE la.activity_type = 'CONVERTED'
       AND l.status = 'CONVERTED'
       AND la.created_at >= ? AND la.created_at < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY DATE(la.created_at)
     ORDER BY date ASC`,
    [toMysqlDate(from), toMysqlDate(to)]
  )
  return rows.map((row) => ({ date: row.date, revenue: Number(row.revenue) }))
}

// ---- Freelancer performance ----

export async function getFreelancerPerformance({ page = 1, limit = 20 }, executor = pool) {
  const offset = (page - 1) * limit
  // Aggregates leads and commissions in separate subqueries before joining
  // to freelancer_profiles — joining both tables directly in one query
  // would fan out (each lead row repeated once per commission row for
  // that freelancer), silently inflating every SUM/COUNT derived from
  // either side.
  const [rows] = await executor.query(
    `SELECT
       fp.id, fp.partner_id, fp.full_name, fp.status, fp.partner_level,
       COALESCE(lead_stats.leads_assigned, 0) AS leads_assigned,
       COALESCE(lead_stats.leads_converted, 0) AS leads_converted,
       COALESCE(lead_stats.revenue, 0) AS revenue,
       COALESCE(commission_stats.commission_earned, 0) AS commission_earned,
       COALESCE(commission_stats.commission_paid, 0) AS commission_paid
     FROM freelancer_profiles fp
     LEFT JOIN (
       SELECT
         assigned_freelancer_id,
         COUNT(*) AS leads_assigned,
         SUM(status = 'CONVERTED') AS leads_converted,
         SUM(CASE WHEN status = 'CONVERTED' THEN conversion_value ELSE 0 END) AS revenue
       FROM leads
       WHERE assigned_freelancer_id IS NOT NULL
       GROUP BY assigned_freelancer_id
     ) lead_stats ON lead_stats.assigned_freelancer_id = fp.id
     LEFT JOIN (
       SELECT
         freelancer_id,
         SUM(commission_amount) AS commission_earned,
         SUM(CASE WHEN status = 'PAID' THEN commission_amount ELSE 0 END) AS commission_paid
       FROM commissions
       GROUP BY freelancer_id
     ) commission_stats ON commission_stats.freelancer_id = fp.id
     ORDER BY revenue DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  )
  const [[{ total }]] = await executor.query('SELECT COUNT(*) AS total FROM freelancer_profiles')

  return {
    rows: rows.map((row) => ({
      id: row.id,
      partnerId: row.partner_id,
      fullName: row.full_name,
      status: row.status,
      partnerLevel: row.partner_level,
      leadsAssigned: Number(row.leads_assigned),
      leadsConverted: Number(row.leads_converted),
      conversionRate: row.leads_assigned > 0 ? Math.round((row.leads_converted / row.leads_assigned) * 10000) / 100 : 0,
      revenue: Number(row.revenue),
      commissionEarned: Number(row.commission_earned),
      commissionPaid: Number(row.commission_paid),
    })),
    total: Number(total),
  }
}

// ---- Webinar funnel ----

export async function getWebinarFunnel(webinarId, executor = pool) {
  const conditions = webinarId ? 'WHERE w.id = ?' : ''
  const params = webinarId ? [webinarId] : []

  const [rows] = await executor.query(
    `SELECT
       w.id, w.title, w.scheduled_at, w.status,
       COUNT(wr.id) AS registered,
       SUM(wr.status = 'ATTENDED') AS attended,
       SUM(wr.status = 'ABSENT') AS absent
     FROM webinars w
     LEFT JOIN webinar_registrations wr ON wr.webinar_id = w.id
     ${conditions}
     GROUP BY w.id, w.title, w.scheduled_at, w.status
     ORDER BY w.scheduled_at DESC
     LIMIT 50`,
    params
  )

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    scheduledAt: row.scheduled_at,
    status: row.status,
    registered: Number(row.registered),
    attended: Number(row.attended),
    absent: Number(row.absent),
    attendanceRate: row.registered > 0 ? Math.round((row.attended / row.registered) * 10000) / 100 : 0,
  }))
}

// ---- Source / service performance ----

export async function getSourcePerformance(from, to, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
       COALESCE(source, 'Unknown') AS source,
       COUNT(*) AS total,
       SUM(status = 'CONVERTED') AS converted,
       COALESCE(SUM(CASE WHEN status = 'CONVERTED' THEN conversion_value ELSE 0 END), 0) AS revenue
     FROM leads
     WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY COALESCE(source, 'Unknown')
     ORDER BY total DESC`,
    [toMysqlDate(from), toMysqlDate(to)]
  )
  return rows.map((row) => ({
    source: row.source,
    total: Number(row.total),
    converted: Number(row.converted),
    conversionRate: row.total > 0 ? Math.round((row.converted / row.total) * 10000) / 100 : 0,
    revenue: Number(row.revenue),
  }))
}

export async function getServicePerformance(from, to, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
       COALESCE(service_interested, 'Unspecified') AS service,
       COUNT(*) AS total,
       SUM(status = 'CONVERTED') AS converted,
       COALESCE(SUM(CASE WHEN status = 'CONVERTED' THEN conversion_value ELSE 0 END), 0) AS revenue
     FROM leads
     WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY COALESCE(service_interested, 'Unspecified')
     ORDER BY total DESC`,
    [toMysqlDate(from), toMysqlDate(to)]
  )
  return rows.map((row) => ({
    service: row.service,
    total: Number(row.total),
    converted: Number(row.converted),
    conversionRate: row.total > 0 ? Math.round((row.converted / row.total) * 10000) / 100 : 0,
    revenue: Number(row.revenue),
  }))
}

// ---- Reports (tabular, exportable) ----

export async function getLeadReport({ from, to, freelancerId, page = 1, limit = 50 }, executor = pool) {
  const offset = (page - 1) * limit
  const conditions = ['l.created_at >= ?', 'l.created_at < DATE_ADD(?, INTERVAL 1 DAY)']
  const params = [toMysqlDate(from), toMysqlDate(to)]
  if (freelancerId) {
    conditions.push('l.assigned_freelancer_id = ?')
    params.push(freelancerId)
  }
  const whereClause = `WHERE ${conditions.join(' AND ')}`

  const [rows] = await executor.query(
    `SELECT l.lead_number, l.client_name, l.mobile, l.status, l.source, l.service_interested,
            fp.full_name AS assigned_freelancer_name, l.created_at
     FROM leads l
     LEFT JOIN freelancer_profiles fp ON fp.id = l.assigned_freelancer_id
     ${whereClause}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [[{ total }]] = await executor.query(`SELECT COUNT(*) AS total FROM leads l ${whereClause}`, params)
  return { rows, total: Number(total) }
}

export async function getSalesReport({ from, to, freelancerId, page = 1, limit = 50 }, executor = pool) {
  const offset = (page - 1) * limit
  const conditions = [
    "la.activity_type = 'CONVERTED'",
    "l.status = 'CONVERTED'",
    'la.created_at >= ?',
    'la.created_at < DATE_ADD(?, INTERVAL 1 DAY)',
  ]
  const params = [toMysqlDate(from), toMysqlDate(to)]
  if (freelancerId) {
    conditions.push('l.assigned_freelancer_id = ?')
    params.push(freelancerId)
  }
  const whereClause = `WHERE ${conditions.join(' AND ')}`

  const [rows] = await executor.query(
    `SELECT l.lead_number, l.client_name, l.service_interested, l.conversion_value, la.created_at AS converted_at,
            fp.full_name AS freelancer_name
     FROM lead_activities la
     INNER JOIN leads l ON l.id = la.lead_id
     LEFT JOIN freelancer_profiles fp ON fp.id = l.assigned_freelancer_id
     ${whereClause}
     ORDER BY la.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [[{ total }]] = await executor.query(
    `SELECT COUNT(*) AS total FROM lead_activities la INNER JOIN leads l ON l.id = la.lead_id ${whereClause}`,
    params
  )
  return { rows, total: Number(total) }
}

export async function getCommissionReport({ from, to, freelancerId, status, page = 1, limit = 50 }, executor = pool) {
  const offset = (page - 1) * limit
  const conditions = ['c.created_at >= ?', 'c.created_at < DATE_ADD(?, INTERVAL 1 DAY)']
  const params = [toMysqlDate(from), toMysqlDate(to)]
  if (freelancerId) {
    conditions.push('c.freelancer_id = ?')
    params.push(freelancerId)
  }
  if (status) {
    conditions.push('c.status = ?')
    params.push(status)
  }
  const whereClause = `WHERE ${conditions.join(' AND ')}`

  const [rows] = await executor.query(
    `SELECT c.id, l.lead_number, fp.full_name AS freelancer_name, c.sale_value, c.commission_amount,
            c.status, c.approved_at, p.payment_date
     FROM commissions c
     INNER JOIN leads l ON l.id = c.lead_id
     INNER JOIN freelancer_profiles fp ON fp.id = c.freelancer_id
     LEFT JOIN payments p ON p.commission_id = c.id
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [[{ total }]] = await executor.query(`SELECT COUNT(*) AS total FROM commissions c ${whereClause}`, params)
  return { rows, total: Number(total) }
}

export async function getWithdrawalReport({ from, to, page = 1, limit = 50 }, executor = pool) {
  const offset = (page - 1) * limit
  const [rows] = await executor.query(
    `SELECT w.id, fp.full_name AS freelancer_name, fp.partner_id, w.amount, w.status,
            w.created_at AS requested_at, w.reviewed_at, w.paid_at, w.transaction_reference
     FROM withdrawal_requests w
     INNER JOIN freelancer_profiles fp ON fp.id = w.freelancer_id
     WHERE w.created_at >= ? AND w.created_at < DATE_ADD(?, INTERVAL 1 DAY)
     ORDER BY w.created_at DESC
     LIMIT ? OFFSET ?`,
    [toMysqlDate(from), toMysqlDate(to), limit, offset]
  )
  const [[{ total }]] = await executor.query(
    'SELECT COUNT(*) AS total FROM withdrawal_requests WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)',
    [toMysqlDate(from), toMysqlDate(to)]
  )
  return { rows, total: Number(total) }
}

export async function getFollowUpReport({ from, to, page = 1, limit = 50 }, executor = pool) {
  const offset = (page - 1) * limit
  const [rows] = await executor.query(
    `SELECT fu.id, l.lead_number, l.client_name, fp.full_name AS freelancer_name,
            fu.follow_up_type, fu.priority, fu.status, fu.scheduled_at, fu.completed_at, fu.outcome
     FROM follow_ups fu
     INNER JOIN leads l ON l.id = fu.lead_id
     LEFT JOIN freelancer_profiles fp ON fp.id = l.assigned_freelancer_id
     WHERE fu.scheduled_at >= ? AND fu.scheduled_at < DATE_ADD(?, INTERVAL 1 DAY)
     ORDER BY fu.scheduled_at DESC
     LIMIT ? OFFSET ?`,
    [toMysqlDate(from), toMysqlDate(to), limit, offset]
  )
  const [[{ total }]] = await executor.query(
    'SELECT COUNT(*) AS total FROM follow_ups WHERE scheduled_at >= ? AND scheduled_at < DATE_ADD(?, INTERVAL 1 DAY)',
    [toMysqlDate(from), toMysqlDate(to)]
  )
  return { rows, total: Number(total) }
}

export async function getCourseCompletionReport({ page = 1, limit = 50 }, executor = pool) {
  const offset = (page - 1) * limit
  const [rows] = await executor.query(
    `SELECT te.id, fp.full_name AS freelancer_name, fp.partner_id, t.title AS training_title,
            te.status, te.progress_percentage, te.started_at, te.completed_at
     FROM training_enrollments te
     INNER JOIN freelancer_profiles fp ON fp.id = te.freelancer_id
     INNER JOIN trainings t ON t.id = te.training_id
     ORDER BY te.started_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  )
  const [[{ total }]] = await executor.query('SELECT COUNT(*) AS total FROM training_enrollments')
  return { rows, total: Number(total) }
}

export async function getTicketReport({ from, to, page = 1, limit = 50 }, executor = pool) {
  const offset = (page - 1) * limit
  const [rows] = await executor.query(
    `SELECT t.id, t.ticket_number, fp.full_name AS freelancer_name, t.category, t.priority, t.status,
            admin.email AS assigned_admin_email, t.created_at, t.resolved_at, t.closed_at
     FROM tickets t
     INNER JOIN freelancer_profiles fp ON fp.id = t.freelancer_id
     LEFT JOIN users admin ON admin.id = t.assigned_admin_id
     WHERE t.created_at >= ? AND t.created_at < DATE_ADD(?, INTERVAL 1 DAY)
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [toMysqlDate(from), toMysqlDate(to), limit, offset]
  )
  const [[{ total }]] = await executor.query(
    'SELECT COUNT(*) AS total FROM tickets WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)',
    [toMysqlDate(from), toMysqlDate(to)]
  )
  return { rows, total: Number(total) }
}

export async function getLostLeadsReport({ from, to, page = 1, limit = 50 }, executor = pool) {
  const offset = (page - 1) * limit
  const [rows] = await executor.query(
    `SELECT l.lead_number, l.client_name, l.status, l.source,
            fp.full_name AS assigned_freelancer_name, l.updated_at, l.notes
     FROM leads l
     LEFT JOIN freelancer_profiles fp ON fp.id = l.assigned_freelancer_id
     WHERE l.status IN ('LOST','NOT_INTERESTED','WRONG_NUMBER')
       AND l.updated_at >= ? AND l.updated_at < DATE_ADD(?, INTERVAL 1 DAY)
     ORDER BY l.updated_at DESC
     LIMIT ? OFFSET ?`,
    [toMysqlDate(from), toMysqlDate(to), limit, offset]
  )
  const [[{ total }]] = await executor.query(
    `SELECT COUNT(*) AS total FROM leads
     WHERE status IN ('LOST','NOT_INTERESTED','WRONG_NUMBER') AND updated_at >= ? AND updated_at < DATE_ADD(?, INTERVAL 1 DAY)`,
    [toMysqlDate(from), toMysqlDate(to)]
  )
  return { rows, total: Number(total) }
}

// ---- Freelancer-scoped analytics (own data only) ----

export async function getFreelancerSummary(freelancerId, executor = pool) {
  const [[leadCounts]] = await executor.query(
    `SELECT
       COUNT(*) AS total_leads,
       SUM(DATE(created_at) = CURDATE()) AS new_leads_today,
       SUM(status = 'CONVERTED') AS converted_leads,
       COALESCE(SUM(CASE WHEN status = 'CONVERTED' THEN conversion_value ELSE 0 END), 0) AS revenue
     FROM leads WHERE assigned_freelancer_id = ?`,
    [freelancerId]
  )

  const [[followUpCounts]] = await executor.query(
    `SELECT COUNT(*) AS follow_ups_today
     FROM follow_ups fu
     INNER JOIN leads l ON l.id = fu.lead_id
     WHERE l.assigned_freelancer_id = ? AND fu.status = 'PENDING' AND DATE(fu.scheduled_at) = CURDATE()`,
    [freelancerId]
  )

  const [[commissionCounts]] = await executor.query(
    `SELECT
       COALESCE(SUM(CASE WHEN status != 'PAID' THEN commission_amount ELSE 0 END), 0) AS commission_pending,
       COALESCE(SUM(CASE WHEN status = 'PAID' THEN commission_amount ELSE 0 END), 0) AS commission_paid,
       COALESCE(SUM(commission_amount), 0) AS commission_earned
     FROM commissions WHERE freelancer_id = ?`,
    [freelancerId]
  )

  return {
    totalLeads: Number(leadCounts.total_leads),
    newLeadsToday: Number(leadCounts.new_leads_today),
    followUpsToday: Number(followUpCounts.follow_ups_today),
    convertedLeads: Number(leadCounts.converted_leads),
    revenue: Number(leadCounts.revenue),
    commissionEarned: Number(commissionCounts.commission_earned),
    commissionPending: Number(commissionCounts.commission_pending),
    commissionPaid: Number(commissionCounts.commission_paid),
  }
}

export async function getFreelancerPipeline(freelancerId, executor = pool) {
  const [rows] = await executor.query(
    'SELECT status, COUNT(*) AS count FROM leads WHERE assigned_freelancer_id = ? GROUP BY status',
    [freelancerId]
  )
  return rows.map((row) => ({ status: row.status, count: Number(row.count) }))
}

export async function getFreelancerPerformanceTrend(freelancerId, from, to, executor = pool) {
  const [rows] = await executor.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS leads_received
     FROM leads
     WHERE assigned_freelancer_id = ? AND created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [freelancerId, toMysqlDate(from), toMysqlDate(to)]
  )
  const [conversions] = await executor.query(
    `SELECT DATE(la.created_at) AS date, COUNT(*) AS converted
     FROM lead_activities la
     INNER JOIN leads l ON l.id = la.lead_id
     WHERE l.assigned_freelancer_id = ? AND la.activity_type = 'CONVERTED' AND l.status = 'CONVERTED'
       AND la.created_at >= ? AND la.created_at < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY DATE(la.created_at)
     ORDER BY date ASC`,
    [freelancerId, toMysqlDate(from), toMysqlDate(to)]
  )

  const convertedByDate = new Map(conversions.map((row) => [row.date, Number(row.converted)]))
  return rows.map((row) => ({
    date: row.date,
    leadsReceived: Number(row.leads_received),
    converted: convertedByDate.get(row.date) ?? 0,
  }))
}

export async function getWebinarReport({ page = 1, limit = 50 }, executor = pool) {
  const offset = (page - 1) * limit
  const [rows] = await executor.query(
    `SELECT w.title, w.scheduled_at, w.status,
            COUNT(wr.id) AS registered, SUM(wr.status = 'ATTENDED') AS attended
     FROM webinars w
     LEFT JOIN webinar_registrations wr ON wr.webinar_id = w.id
     GROUP BY w.id, w.title, w.scheduled_at, w.status
     ORDER BY w.scheduled_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  )
  const [[{ total }]] = await executor.query('SELECT COUNT(*) AS total FROM webinars')
  return {
    rows: rows.map((row) => ({ ...row, registered: Number(row.registered), attended: Number(row.attended) })),
    total: Number(total),
  }
}
