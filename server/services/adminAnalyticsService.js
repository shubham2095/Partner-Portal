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
    fetch: analyticsModel.getLeadReport,
    columns: ['lead_number', 'client_name', 'mobile', 'status', 'source', 'service_interested', 'assigned_freelancer_name', 'created_at'],
    defaultDays: 30,
  },
  sales: {
    fetch: analyticsModel.getSalesReport,
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
    fetch: analyticsModel.getCommissionReport,
    columns: ['id', 'lead_number', 'freelancer_name', 'sale_value', 'commission_amount', 'status', 'approved_at', 'payment_date'],
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

  if (handler.defaultDays === null) {
    const { rows, total } = await handler.fetch({ page, limit })
    return { rows, total, page, limit }
  }

  const { from, to } = resolveDateRange(query, handler.defaultDays)
  const { rows, total } = await handler.fetch({ from, to, page, limit })
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
