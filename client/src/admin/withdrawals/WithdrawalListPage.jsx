import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Badge, ErrorState, PageHeader, EmptyState } from '../../components/ui'
import { Select } from '../../components/forms'
import { ArrowUpRight } from 'lucide-react'
import { listWithdrawals } from '../../services/adminWithdrawalService'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'PAID']
const STATUS_OPTIONS = [{ value: '', label: 'All Statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))]

const STATUS_VARIANTS = { PENDING: 'info', APPROVED: 'warning', REJECTED: 'danger', PAID: 'success' }

const LIMIT = 20

export default function WithdrawalListPage() {
  const [withdrawals, setWithdrawals] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadWithdrawals = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listWithdrawals({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      })
      setWithdrawals(response.data.withdrawals)
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
  }, [statusFilter, search])

  useEffect(() => {
    loadWithdrawals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search])

  if (hasError) return <ErrorState title="Unable to load withdrawals" onRetry={loadWithdrawals} />

  const columns = [
    {
      key: 'id',
      header: 'Request',
      render: (row) => (
        <Link to={`/admin/withdrawals/${row.id}`} className="text-primary hover:underline">
          #{row.id}
        </Link>
      ),
    },
    { key: 'freelancer_name', header: 'Freelancer', render: (row) => `${row.freelancer_name} (${row.partner_id ?? '—'})` },
    { key: 'amount', header: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'created_at', header: 'Requested', render: (row) => new Date(row.created_at).toLocaleString() },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Withdrawals" description="Review and process freelancer withdrawal requests." />

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search freelancer name or partner ID" />
        <Select id="statusFilter" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
      </FilterBar>

      {!isLoading && withdrawals.length === 0 ? (
        <EmptyState icon={ArrowUpRight} title="No withdrawal requests" description="Requests matching this view will appear here." />
      ) : (
        <Table columns={columns} data={withdrawals} isLoading={isLoading} emptyMessage="No withdrawal requests found." rowKey="id" />
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />
    </div>
  )
}
