import { useEffect, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useListQuery } from '../../hooks/useListQuery'
import { Link, useNavigate } from 'react-router-dom'
import { Table, Pagination, SearchBar, FilterBar, StatCard, StatusChips } from '../../components/data-display'
import { Badge, ErrorState, PageHeader, EmptyState } from '../../components/ui'
import { Select } from '../../components/forms'
import { LifeBuoy, UserX, AlertTriangle } from 'lucide-react'
import { listTickets, getDashboardCounts, listAssignableAdmins } from '../../services/adminTicketService'

const CATEGORIES = ['LEAD_ISSUE', 'COMMISSION_ISSUE', 'PAYMENT_WITHDRAWAL', 'COURSE_TRAINING', 'TECHNICAL_ISSUE', 'PROFILE_ACCOUNT', 'GENERAL_QUERY']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_FREELANCER', 'RESOLVED', 'CLOSED']

const STATUS_VARIANTS = {
  OPEN: 'info',
  ASSIGNED: 'info',
  IN_PROGRESS: 'warning',
  WAITING_FOR_FREELANCER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
}
const PRIORITY_VARIANTS = { LOW: 'default', MEDIUM: 'info', HIGH: 'warning', URGENT: 'danger' }

const CHIP_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const CHIP_OPTIONS = [
  { value: '', label: 'All' },
  ...CHIP_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) })),
]

const LIMIT = 20

async function countByStatus(status) {
  const res = await listTickets({ status: status || undefined, page: 1, limit: 1 })
  return res?.meta?.total ?? 0
}

export default function TicketListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [adminFilter, setAdminFilter] = useState('')
  const [admins, setAdmins] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [counts, setCounts] = useState(null)

  const {
    rows: tickets,
    page,
    setPage,
    totalPages,
    isLoading,
    hasError,
    reload,
  } = useListQuery(
    (params) => listTickets(params).then((r) => ({ rows: r.data.tickets, total: r.meta.total })),
    {
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      priority: priorityFilter || undefined,
      assignedAdminId: adminFilter || undefined,
      search: search || undefined,
    },
    { limit: LIMIT }
  )

  useEffect(() => {
    Promise.all([getDashboardCounts(), listAssignableAdmins()])
      .then(([countsData, adminsData]) => {
        setCounts(countsData)
        setAdmins(adminsData)
      })
      .catch(() => {
        /* handled by interceptor toast */
      })
  }, [])

  if (hasError) return <ErrorState title="Unable to load tickets" onRetry={reload} />

  const columns = [
    {
      key: 'ticket_number',
      header: 'Ticket',
      render: (row) => (
        <Link
          to={`/admin/tickets/${row.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-primary hover:underline"
        >
          {row.ticket_number}
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
    { key: 'subject', header: 'Subject' },
    { key: 'category', header: 'Category', render: (row) => row.category.replace(/_/g, ' ') },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <Badge variant={PRIORITY_VARIANTS[row.priority] ?? 'default'}>{row.priority}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status.replace(/_/g, ' ')}</Badge>,
    },
    { key: 'assigned_admin_email', header: 'Assigned', render: (row) => row.assigned_admin_email ?? <span className="text-text-secondary">Unassigned</span> },
    { key: 'updated_at', header: 'Updated', render: (row) => new Date(row.updated_at).toLocaleDateString() },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Support Tickets" description="Manage freelancer support requests." />

      {counts && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Unassigned Open" value={counts.unassignedOpen} icon={UserX} accent="warning" />
          <StatCard label="High/Urgent Open" value={counts.highPriorityOpen} icon={AlertTriangle} accent="danger" />
        </div>
      )}

      <StatusChips options={CHIP_OPTIONS} value={statusFilter} onChange={setStatusFilter} fetchCount={countByStatus} />

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search subject, ticket number, freelancer" />
        <Select
          id="statusFilter"
          options={[{ value: '', label: 'All Statuses' }, ...STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
        <Select
          id="categoryFilter"
          options={[{ value: '', label: 'All Categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))]}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
        <Select
          id="priorityFilter"
          options={[{ value: '', label: 'All Priorities' }, ...PRIORITIES.map((p) => ({ value: p, label: p }))]}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        />
        <Select
          id="adminFilter"
          options={[{ value: '', label: 'All Admins' }, ...admins.map((a) => ({ value: String(a.id), label: a.email }))]}
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value)}
        />
      </FilterBar>

      {!isLoading && tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets" description="Tickets matching this view will appear here." />
      ) : (
        <Table
          columns={columns}
          data={tickets}
          isLoading={isLoading}
          emptyMessage="No tickets found."
          rowKey="id"
          onRowClick={(row) => navigate(`/admin/tickets/${row.id}`)}
        />
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
