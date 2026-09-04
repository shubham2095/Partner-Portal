import { useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useListQuery } from '../../hooks/useListQuery'
import { Link, useNavigate } from 'react-router-dom'
import { Table, Pagination, SearchBar, FilterBar, StatusChips } from '../../components/data-display'
import { Badge, ErrorState, PageHeader, EmptyState } from '../../components/ui'
import { Select } from '../../components/forms'
import { ArrowUpRight } from 'lucide-react'
import { listWithdrawals } from '../../services/adminWithdrawalService'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'PAID']
const STATUS_OPTIONS = [{ value: '', label: 'All Statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))]
const CHIP_OPTIONS = [{ value: '', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s[0] + s.slice(1).toLowerCase() }))]

const STATUS_VARIANTS = { PENDING: 'info', APPROVED: 'warning', REJECTED: 'danger', PAID: 'success' }

const LIMIT = 20

async function countByStatus(status) {
  const res = await listWithdrawals({ status: status || undefined, page: 1, limit: 1 })
  return res?.meta?.total ?? 0
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function WithdrawalListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)

  const {
    rows: withdrawals,
    page,
    setPage,
    totalPages,
    isLoading,
    hasError,
    reload,
  } = useListQuery(
    (params) => listWithdrawals(params).then((r) => ({ rows: r.data.withdrawals, total: r.meta.total })),
    { status: statusFilter || undefined, search: search || undefined },
    { limit: LIMIT }
  )

  if (hasError) return <ErrorState title="Unable to load withdrawals" onRetry={reload} />

  const columns = [
    {
      key: 'id',
      header: 'Request',
      render: (row) => (
        <Link
          to={`/admin/withdrawals/${row.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-primary hover:underline"
        >
          #{row.id}
        </Link>
      ),
    },
    {
      key: 'freelancer_name',
      header: 'Freelancer',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-text-primary">{row.freelancer_name}</p>
          <p className="text-xs text-text-muted">{row.partner_id ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => <span className="font-semibold tabular-nums text-text-primary">₹{Number(row.amount).toLocaleString('en-IN')}</span>,
    },
    { key: 'created_at', header: 'Requested', render: (row) => formatDateTime(row.created_at) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'} dot>
          {row.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Withdrawals" description="Review and process freelancer withdrawal requests." />

      <StatusChips options={CHIP_OPTIONS} value={statusFilter} onChange={setStatusFilter} fetchCount={countByStatus} />

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search freelancer name or partner ID" />
        <Select id="statusFilter" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
      </FilterBar>

      {!isLoading && withdrawals.length === 0 ? (
        <EmptyState icon={ArrowUpRight} title="No withdrawal requests" description="Requests matching this view will appear here." />
      ) : (
        <Table
          columns={columns}
          data={withdrawals}
          isLoading={isLoading}
          emptyMessage="No withdrawal requests found."
          rowKey="id"
          onRowClick={(row) => navigate(`/admin/withdrawals/${row.id}`)}
        />
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
