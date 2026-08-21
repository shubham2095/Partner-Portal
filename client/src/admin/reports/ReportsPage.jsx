import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Table, Pagination, FilterBar } from '../../components/data-display'
import { Button, ErrorState, PageHeader } from '../../components/ui'
import { Select, DatePicker } from '../../components/forms'
import { getReport, exportReport } from '../../services/adminAnalyticsService'

const LIMIT = 20

const REPORT_TYPES = [
  {
    value: 'lead',
    label: 'Leads',
    supportsDateRange: true,
    columns: [
      { key: 'lead_number', header: 'Lead #' },
      { key: 'client_name', header: 'Client' },
      { key: 'mobile', header: 'Mobile' },
      { key: 'status', header: 'Status' },
      { key: 'source', header: 'Source' },
      { key: 'service_interested', header: 'Service' },
      { key: 'assigned_freelancer_name', header: 'Freelancer' },
      { key: 'created_at', header: 'Created' },
    ],
  },
  {
    value: 'sales',
    label: 'Sales',
    supportsDateRange: true,
    columns: [
      { key: 'lead_number', header: 'Lead #' },
      { key: 'client_name', header: 'Client' },
      { key: 'service_interested', header: 'Service' },
      { key: 'conversion_value', header: 'Sale Value', render: (row) => `₹${row.conversion_value ?? 0}` },
      { key: 'converted_at', header: 'Converted At' },
      { key: 'freelancer_name', header: 'Freelancer' },
    ],
  },
  {
    value: 'revenue',
    label: 'Revenue',
    supportsDateRange: true,
    columns: [
      { key: 'date', header: 'Date' },
      { key: 'revenue', header: 'Revenue', render: (row) => `₹${row.revenue ?? 0}` },
    ],
  },
  {
    value: 'commission',
    label: 'Commissions',
    supportsDateRange: true,
    columns: [
      { key: 'lead_number', header: 'Lead #' },
      { key: 'freelancer_name', header: 'Freelancer' },
      { key: 'sale_value', header: 'Sale Value', render: (row) => `₹${row.sale_value ?? 0}` },
      { key: 'commission_amount', header: 'Commission', render: (row) => `₹${row.commission_amount ?? 0}` },
      { key: 'status', header: 'Status' },
      { key: 'approved_at', header: 'Approved At' },
      { key: 'payment_date', header: 'Paid At' },
    ],
  },
  {
    value: 'lost-leads',
    label: 'Lost Leads',
    supportsDateRange: true,
    columns: [
      { key: 'lead_number', header: 'Lead #' },
      { key: 'client_name', header: 'Client' },
      { key: 'status', header: 'Status' },
      { key: 'source', header: 'Source' },
      { key: 'assigned_freelancer_name', header: 'Freelancer' },
      { key: 'updated_at', header: 'Updated' },
    ],
  },
  {
    value: 'webinar',
    label: 'Webinars',
    supportsDateRange: false,
    columns: [
      { key: 'title', header: 'Title' },
      { key: 'scheduled_at', header: 'Scheduled At' },
      { key: 'status', header: 'Status' },
      { key: 'registered', header: 'Registered' },
      { key: 'attended', header: 'Attended' },
    ],
  },
  {
    value: 'freelancer',
    label: 'Freelancer Performance',
    supportsDateRange: false,
    columns: [
      { key: 'partnerId', header: 'Partner ID' },
      { key: 'fullName', header: 'Name' },
      { key: 'status', header: 'Status' },
      { key: 'partnerLevel', header: 'Level' },
      { key: 'leadsAssigned', header: 'Leads Assigned' },
      { key: 'leadsConverted', header: 'Leads Converted' },
      { key: 'revenue', header: 'Revenue', render: (row) => `₹${row.revenue ?? 0}` },
      { key: 'commissionEarned', header: 'Commission Earned', render: (row) => `₹${row.commissionEarned ?? 0}` },
      { key: 'commissionPaid', header: 'Commission Paid', render: (row) => `₹${row.commissionPaid ?? 0}` },
    ],
  },
  {
    value: 'conversion',
    label: 'Conversion Funnel',
    supportsDateRange: false,
    columns: [
      { key: 'stage', header: 'Stage' },
      { key: 'count', header: 'Count' },
      { key: 'percentageOfTotal', header: '% of Total', render: (row) => `${row.percentageOfTotal}%` },
    ],
  },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState('lead')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const activeConfig = REPORT_TYPES.find((r) => r.value === reportType)

  const loadReport = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const params = { page, limit: LIMIT }
      if (activeConfig.supportsDateRange) {
        if (dateFrom) params.dateFrom = dateFrom
        if (dateTo) params.dateTo = dateTo
      }
      const response = await getReport(reportType, params)
      setRows(response.rows.map((row, index) => ({ ...row, _rowKey: index })))
      setTotal(response.total)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [reportType, dateFrom, dateTo])

  useEffect(() => {
    loadReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, dateFrom, dateTo, page])

  const onExport = async () => {
    setIsExporting(true)
    try {
      const params = {}
      if (activeConfig.supportsDateRange) {
        if (dateFrom) params.dateFrom = dateFrom
        if (dateTo) params.dateTo = dateTo
      }
      const blob = await exportReport(reportType, params)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportType}-report.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  if (hasError) return <ErrorState title="Unable to load this report" onRetry={loadReport} />

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Reports"
        description="Generate and export analytics reports."
        actions={
          <Button onClick={onExport} isLoading={isExporting} variant="secondary">
            Export CSV
          </Button>
        }
      />

      <FilterBar>
        <Select
          id="reportType"
          options={REPORT_TYPES.map((r) => ({ value: r.value, label: r.label }))}
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        />
        {activeConfig.supportsDateRange && (
          <>
            <DatePicker id="dateFrom" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <DatePicker id="dateTo" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </>
        )}
      </FilterBar>

      <Table
        columns={activeConfig.columns}
        data={rows}
        isLoading={isLoading}
        emptyMessage="No records found."
        rowKey="_rowKey"
      />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />
    </div>
  )
}
