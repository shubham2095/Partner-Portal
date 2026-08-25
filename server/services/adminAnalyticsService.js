import { ApiError } from '../utils/ApiError.js'
import { resolveDateRange } from '../utils/dateRange.js'
import * as analyticsModel from '../models/analyticsModel.js'
import { buildCsv } from './csvExportService.js'

export async function getOverview() {
  return analyticsModel.getAdminOverview()
}

export async function getLeadsOverTime(query) {
  const { from, to } = resolveDateRange(query)
  return { from, to, series: await analyticsModel.getLeadsOverTime(from, to) }
}

export async function getConversionFunnel() {
  return analyticsModel.getConversionFunnel()
}

export async function getRevenueTrend(query) {
  const { from, to } = resolveDateRange(query)
  return { from, to, series: await analyticsModel.getRevenueTrend(from, to) }
}

export async function getFreelancerPerformance(query) {
  const { rows, total } = await analyticsModel.getFreelancerPerformance(query)
  return { rows, total, page: query.page, limit: query.limit }
}

export async function getWebinarFunnel(webinarId) {
  return analyticsModel.getWebinarFunnel(webinarId)
}

export async function getSourcePerformance(query) {
  const { from, to } = resolveDateRange(query)
  return { from, to, rows: await analyticsModel.getSourcePerformance(from, to) }
}

export async function getServicePerformance(query) {
  const { from, to } = resolveDateRange(query)
  return { from, to, rows: await analyticsModel.getServicePerformance(from, to) }
}

// ---- Reports ----

const REPORT_HANDLERS = {
  lead: {
    // "Freelancer-wise lead report" (PDF §22.14.1) is this same report with
    // an optional ?freelancerId= filter, not a separate report type.
    fetch: ({ from, to, page, limit, freelancerId }) => analyticsModel.getLeadReport({ from, to, page, limit, freelancerId }),
    columns: ['lead_number', 'client_name', 'mobile', 'status', 'source', 'service_interested', 'assigned_freelancer_name', 'created_at'],
    defaultDays: 30,
  },
  sales: {
    // Also satisfies "freelancer-wise closed-deal report" (§22.14.3) via the
    // same freelancerId filter.
    fetch: ({ from, to, page, limit, freelancerId }) => analyticsModel.getSalesReport({ from, to, page, limit, freelancerId }),
    columns: ['lead_number', 'client_name', 'service_interested', 'conversion_value', 'converted_at', 'freelancer_name'],
    defaultDays: 90,
  },
  revenue: {
    fetch: async ({ from, to, page, limit }) => {
      const series = await analyticsModel.getRevenueTrend(from, to)
      const total = series.length
      const offset = (page - 1) * limit
      return { rows: series.slice(offset, offset + limit), total }
    },
    columns: ['date', 'revenue'],
    defaultDays: 90,
  },
  commission: {
    // Also satisfies "freelancer-wise commission report" (§22.14.4),
    // "pending commission report" (§22.14.5, ?status=POTENTIAL|EARNED|APPROVED|PAYABLE)
    // and "paid commission report" (§22.14.6, ?status=PAID) via the same
    // freelancerId/status filters — not three separate report types.
    fetch: ({ from, to, page, limit, freelancerId, status }) =>
      analyticsModel.getCommissionReport({ from, to, page, limit, freelancerId, status }),
    columns: ['id', 'lead_number', 'freelancer_name', 'sale_value', 'commission_amount', 'status', 'approved_at', 'payment_date'],
    defaultDays: 90,
  },
  withdrawal: {
    fetch: analyticsModel.getWithdrawalReport,
    columns: ['id', 'freelancer_name', 'partner_id', 'amount', 'status', 'requested_at', 'reviewed_at', 'paid_at', 'transaction_reference'],
    defaultDays: 90,
  },
  'follow-up': {
    fetch: analyticsModel.getFollowUpReport,
    columns: ['id', 'lead_number', 'client_name', 'freelancer_name', 'follow_up_type', 'priority', 'status', 'scheduled_at', 'completed_at', 'outcome'],
    defaultDays: 30,
  },
  course: {
    fetch: async ({ page, limit }) => analyticsModel.getCourseCompletionReport({ page, limit }),
    columns: ['freelancer_name', 'partner_id', 'training_title', 'status', 'progress_percentage', 'started_at', 'completed_at'],
    defaultDays: null,
  },
  ticket: {
    fetch: analyticsModel.getTicketReport,
    columns: ['id', 'ticket_number', 'freelancer_name', 'category', 'priority', 'status', 'assigned_admin_email', 'created_at', 'resolved_at', 'closed_at'],
    defaultDays: 90,
  },
  'lost-leads': {
    fetch: analyticsModel.getLostLeadsReport,
    columns: ['lead_number', 'client_name', 'status', 'source', 'assigned_freelancer_name', 'updated_at', 'notes'],
    defaultDays: 90,
  },
  webinar: {
    fetch: analyticsModel.getWebinarReport,
    columns: ['title', 'scheduled_at', 'status', 'registered', 'attended'],
    defaultDays: null,
  },
  freelancer: {
    fetch: async ({ page, limit }) => analyticsModel.getFreelancerPerformance({ page, limit }),
    columns: ['id', 'partnerId', 'fullName', 'status', 'partnerLevel', 'leadsAssigned', 'leadsConverted', 'conversionRate', 'revenue', 'commissionEarned', 'commissionPaid'],
    defaultDays: null,
  },
  conversion: {
    fetch: async () => {
      const stages = await analyticsModel.getConversionFunnel()
      const totalAtOrPastNew = stages[0]?.count || 1
      return {
        rows: stages.map((stage) => ({
          ...stage,
          percentageOfTotal: Math.round((stage.count / totalAtOrPastNew) * 10000) / 100,
        })),
        total: stages.length,
      }
    },
    columns: ['stage', 'count', 'percentageOfTotal'],
    defaultDays: null,
  },
}

export async function getReport(type, query) {
  const handler = REPORT_HANDLERS[type]
  if (!handler) {
    throw new ApiError(404, 'Unknown report type')
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 50
  const freelancerId = query.freelancerId ? Number(query.freelancerId) : undefined
  const status = query.status || undefined

  if (handler.defaultDays === null) {
    const { rows, total } = await handler.fetch({ page, limit, freelancerId, status })
    return { rows, total, page, limit }
  }

  const { from, to } = resolveDateRange(query, handler.defaultDays)
  const { rows, total } = await handler.fetch({ from, to, page, limit, freelancerId, status })
  return { rows, total, page, limit, from, to }
}

export async function exportReportCsv(type, query) {
  const handler = REPORT_HANDLERS[type]
  if (!handler) {
    throw new ApiError(404, 'Unknown report type')
  }

  // Exports are capped at a generous but bounded row count — never an
  // unbounded dump of the whole table.
  const { rows } = await getReport(type, { ...query, page: 1, limit: 5000 })
  return buildCsv(rows, handler.columns)
}
