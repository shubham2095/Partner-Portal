import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Badge, ErrorState } from '../../components/ui'
import { Select } from '../../components/forms'
import { listMyLeads } from '../../services/freelancerLeadService'
import { LEAD_STATUSES, STATUS_VARIANTS } from '../../utils/leadConstants'

const STATUS_OPTIONS = [{ value: '', label: 'All Statuses' }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))]

const LIMIT = 20

export default function LeadListPage() {
  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadLeads = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listMyLeads({
        status: statusFilter || undefined,
        search: search || undefined,
        sortBy: 'created_at',
        sortDir: 'DESC',
        page,
        limit: LIMIT,
      })
      setLeads(response.data.leads)
      setTotal(response.meta.total)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    loadLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter])

  if (hasError) return <ErrorState onRetry={loadLeads} />

  const columns = [
    {
      key: 'lead_number',
      header: 'Lead',
      render: (row) => (
        <Link to={`/freelancer/leads/${row.id}`} className="text-primary hover:underline">
          {row.lead_number ?? `#${row.id}`}
        </Link>
      ),
    },
    { key: 'client_name', header: 'Client', render: (row) => `${row.client_name}${row.company ? ` (${row.company})` : ''}` },
    { key: 'mobile', header: 'Mobile' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'follow_up_date',
      header: 'Next Follow-up',
      render: (row) => (row.follow_up_date ? new Date(row.follow_up_date).toLocaleString() : '—'),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">My Leads</h2>
        <p className="text-sm text-text-secondary">Leads assigned to you.</p>
      </div>

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search name, mobile, email" />
        <Select id="statusFilter" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
      </FilterBar>

      <Table columns={columns} data={leads} isLoading={isLoading} emptyMessage="No leads assigned yet." />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />
    </div>
  )
}
