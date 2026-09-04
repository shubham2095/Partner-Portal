import { useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useListQuery } from '../../hooks/useListQuery'
import { Link, useNavigate } from 'react-router-dom'
import { Table, Pagination, SearchBar, FilterBar, StatusChips } from '../../components/data-display'
import Select from '../../components/forms/Select'
import Badge from '../../components/ui/Badge'
import ErrorState from '../../components/ui/ErrorState'
import PageHeader from '../../components/ui/PageHeader'
import Avatar from '../../components/ui/Avatar'
import { listFreelancers } from '../../services/adminFreelancerService'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'CERTIFIED', label: 'Certified' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const STATUS_VARIANTS = {
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
  QUALIFIED: 'info',
  CERTIFIED: 'success',
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  INACTIVE: 'default',
}

// Status chips shown as a quick-filter strip (with live counts).
const CHIP_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'CERTIFIED', label: 'Certified' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

const LIMIT = 20

async function countByStatus(status) {
  const res = await listFreelancers({ status: status || undefined, page: 1, limit: 1 })
  return res?.meta?.total ?? 0
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function FreelancerListPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState('')

  const {
    rows: freelancers,
    page,
    setPage,
    totalPages,
    isLoading,
    hasError,
    reload,
  } = useListQuery(
    (params) => listFreelancers(params).then((r) => ({ rows: r.data.freelancers, total: r.meta.total })),
    { status: statusFilter || undefined, search: search || undefined },
    { limit: LIMIT }
  )

  if (hasError) return <ErrorState title="Unable to load freelancers" onRetry={reload} />

  const columns = [
    {
      key: 'full_name',
      header: 'Freelancer',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.full_name} size={34} />
          <div className="min-w-0">
            <p className="truncate font-medium text-text-primary">{row.full_name}</p>
            <p className="text-xs text-text-muted">{row.partner_id ?? 'Pending ID'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-text-primary">{row.email}</p>
          <p className="text-xs text-text-muted">{row.mobile || '—'}</p>
        </div>
      ),
    },
    { key: 'location', header: 'Location', render: (row) => row.location || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Account',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'danger'} dot>
          {row.is_active ? 'Active' : 'Suspended'}
        </Badge>
      ),
    },
    { key: 'created_at', header: 'Joined', render: (row) => formatDate(row.created_at) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Link
          to={`/admin/freelancers/${row.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium text-primary hover:underline"
        >
          View
        </Link>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Freelancers" description="Review, verify, and manage freelancer accounts." />

      <StatusChips
        options={CHIP_OPTIONS}
        value={statusFilter}
        onChange={setStatusFilter}
        fetchCount={countByStatus}
      />

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search by name, email, or partner ID" />
        <Select
          id="statusFilter"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
      </FilterBar>

      <Table
        columns={columns}
        data={freelancers}
        isLoading={isLoading}
        emptyMessage="No freelancers match these filters."
        onRowClick={(row) => navigate(`/admin/freelancers/${row.id}`)}
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
