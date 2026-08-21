import { useEffect, useState } from 'react'
import { Table, Pagination, FilterBar, StatCard } from '../../components/data-display'
import { ErrorState, PageHeader } from '../../components/ui'
import { DatePicker } from '../../components/forms'
import { getReport, getOverview } from '../../services/adminAnalyticsService'

const LIMIT = 20

const COLUMNS = [
  { key: 'lead_number', header: 'Lead #' },
  { key: 'client_name', header: 'Client' },
  { key: 'service_interested', header: 'Service' },
  { key: 'conversion_value', header: 'Sale Value', render: (row) => `₹${row.conversion_value ?? 0}` },
  { key: 'converted_at', header: 'Converted At' },
  { key: 'freelancer_name', header: 'Freelancer' },
]

function formatCurrency(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN')}`
}

export default function SalesPage() {
  const [overview, setOverview] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadSales = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const params = { page, limit: LIMIT }
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      const [salesReport, overviewData] = await Promise.all([getReport('sales', params), getOverview()])
      setRows(salesReport.rows.map((row, index) => ({ ...row, _rowKey: index })))
      setTotal(salesReport.total)
      setOverview(overviewData)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [dateFrom, dateTo])

  useEffect(() => {
    loadSales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, page])

  if (hasError) return <ErrorState onRetry={loadSales} />

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Sales" description="Converted leads and their sale value." />

      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Converted Leads" value={overview.convertedLeads} />
          <StatCard label="Total Revenue" value={formatCurrency(overview.revenue)} />
          <StatCard label="Total Leads" value={overview.totalLeads} />
        </div>
      )}

      <FilterBar>
        <DatePicker id="dateFrom" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <DatePicker id="dateTo" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </FilterBar>

      <Table columns={COLUMNS} data={rows} isLoading={isLoading} emptyMessage="No sales found." rowKey="_rowKey" />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />
    </div>
  )
}
