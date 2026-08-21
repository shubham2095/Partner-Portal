import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Badge, Card, ErrorState, PageHeader } from '../../components/ui'
import { Select } from '../../components/forms'
import { listAvailableWebinars, listMyRegistrations } from '../../services/freelancerWebinarService'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'LIVE', label: 'Live' },
  { value: 'COMPLETED', label: 'Completed' },
]

const STATUS_VARIANTS = {
  PUBLISHED: 'info',
  LIVE: 'success',
  COMPLETED: 'success',
  REGISTERED: 'default',
  ATTENDED: 'success',
  ABSENT: 'danger',
  CANCELLED: 'danger',
}

const LIMIT = 20

export default function WebinarListPage() {
  const [webinars, setWebinars] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [myRegistrations, setMyRegistrations] = useState([])

  const loadWebinars = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listAvailableWebinars({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      })
      setWebinars(response.data.webinars)
      setTotal(response.meta.total)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMyRegistrations = async () => {
    try {
      const registrations = await listMyRegistrations()
      setMyRegistrations(registrations)
    } catch (error) {
      // handled by interceptor toast
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
    loadWebinars()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter])

  useEffect(() => {
    loadMyRegistrations()
  }, [])

  if (hasError) return <ErrorState onRetry={loadWebinars} />

  const columns = [
    { key: 'title', header: 'Title' },
    {
      key: 'scheduled_at',
      header: 'Scheduled',
      render: (row) => (row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : '—'),
    },
    { key: 'speaker_name', header: 'Speaker', render: (row) => row.speaker_name ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Link to={`/freelancer/webinars/${row.id}`} className="text-sm text-primary hover:underline">
          View
        </Link>
      ),
    },
  ]

  const registrationColumns = [
    { key: 'title', header: 'Webinar' },
    {
      key: 'scheduled_at',
      header: 'Scheduled',
      render: (row) => (row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : '—'),
    },
    {
      key: 'status',
      header: 'My Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Link to={`/freelancer/webinars/${row.webinar_id}`} className="text-sm text-primary hover:underline">
          View
        </Link>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Webinars" description="Browse and register for upcoming webinars." />
      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search by title" />
        <Select
          id="statusFilter"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
      </FilterBar>
      <Table columns={columns} data={webinars} isLoading={isLoading} emptyMessage="No webinars found." />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">My Registrations</h3>
        <Table columns={registrationColumns} data={myRegistrations} emptyMessage="You haven't registered for any webinars yet." />
      </Card>
    </div>
  )
}
