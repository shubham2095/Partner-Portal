import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import Select from '../../components/forms/Select'
import Badge from '../../components/ui/Badge'
import ErrorState from '../../components/ui/ErrorState'
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

const LIMIT = 20

export default function FreelancerListPage() {
  const [freelancers, setFreelancers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadFreelancers = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listFreelancers({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      })
      setFreelancers(response.data.freelancers)
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
    loadFreelancers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter])

  if (hasError) return <ErrorState onRetry={loadFreelancers} />

  const columns = [
    { key: 'partner_id', header: 'Partner ID', render: (row) => row.partner_id ?? '—' },
    { key: 'full_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'mobile', header: 'Mobile' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
    {
      key: 'is_active',
      header: 'Account',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'danger'}>{row.is_active ? 'Active' : 'Suspended'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Link to={`/admin/freelancers/${row.id}`} className="text-sm text-primary hover:underline">
          View
        </Link>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Freelancers</h2>
        <p className="text-sm text-text-secondary">Review, verify, and manage freelancer accounts.</p>
      </div>
      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search by name, email, or partner ID" />
        <Select id="statusFilter" options={STATUS_OPTIONS} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} />
      </FilterBar>
      <Table columns={columns} data={freelancers} isLoading={isLoading} emptyMessage="No freelancers found." />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />
    </div>
  )
}
