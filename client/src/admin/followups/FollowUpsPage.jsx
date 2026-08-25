import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarClock } from 'lucide-react'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Badge, ErrorState, PageHeader, EmptyState } from '../../components/ui'
import { Select } from '../../components/forms'
import { listFollowUps } from '../../services/adminLeadService'
import { listFreelancers } from '../../services/adminFreelancerService'

const FOLLOWUP_TYPES = ['PHONE_CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'VIDEO_CALL', 'SITE_VISIT', 'DEMO', 'OTHER']
const TYPE_OPTIONS = [{ value: '', label: 'All Types' }, ...FOLLOWUP_TYPES.map((v) => ({ value: v, label: v.replace(/_/g, ' ') }))]
const FOLLOWUP_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const PRIORITY_OPTIONS = [{ value: '', label: 'All Priorities' }, ...FOLLOWUP_PRIORITIES.map((v) => ({ value: v, label: v }))]
const PRIORITY_VARIANTS = { LOW: 'default', MEDIUM: 'info', HIGH: 'danger' }

const TABS = [
  { value: 'today', label: 'Today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: '', label: 'All' },
]

const STATUS_VARIANTS = { PENDING: 'info', COMPLETED: 'success', CANCELLED: 'danger' }
const BUCKET_VALUES = new Set(['today', 'overdue', 'tomorrow', 'upcoming'])

const LIMIT = 20

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState('today')
  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [freelancerFilter, setFreelancerFilter] = useState('')
  const [freelancers, setFreelancers] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadFreelancers = async () => {
    try {
      const response = await listFreelancers({ page: 1, limit: 100 })
      setFreelancers(response.data.freelancers)
    } catch (error) {
      // handled by interceptor toast
    }
  }

  const loadFollowUps = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const params = {
        page,
        limit: LIMIT,
        followUpType: typeFilter || undefined,
        priority: priorityFilter || undefined,
        assignedFreelancerId: freelancerFilter || undefined,
        search: search || undefined,
      }
      if (BUCKET_VALUES.has(tab)) {
        params.bucket = tab
      } else if (tab) {
        params.status = tab
      }
      const response = await listFollowUps(params)
      setFollowUps(response.data.followUps)
      setTotal(response.meta.total)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFreelancers()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [tab, typeFilter, priorityFilter, freelancerFilter, search])

  useEffect(() => {
    loadFollowUps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tab, typeFilter, priorityFilter, freelancerFilter, search])

  if (hasError) return <ErrorState title="Unable to load follow-ups" onRetry={loadFollowUps} />

  const columns = [
    {
      key: 'client_name',
      header: 'Lead',
      render: (row) => (
        <Link to={`/admin/leads/${row.lead_id}`} className="text-primary hover:underline">
          {row.client_name} ({row.lead_number})
        </Link>
      ),
    },
    {
      key: 'assigned_freelancer_name',
      header: 'Freelancer',
      render: (row) => row.assigned_freelancer_name ?? <span className="text-text-secondary">Unassigned</span>,
    },
    { key: 'follow_up_type', header: 'Type', render: (row) => row.follow_up_type.replace(/_/g, ' ') },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <Badge variant={PRIORITY_VARIANTS[row.priority] ?? 'default'}>{row.priority}</Badge>,
    },
    {
      key: 'scheduled_at',
      header: 'Scheduled',
      render: (row) => {
        const isOverdue = row.status === 'PENDING' && new Date(row.scheduled_at) < new Date()
        return (
          <span className={isOverdue ? 'flex items-center gap-1 font-medium text-danger' : ''}>
            {isOverdue && <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />}
            {new Date(row.scheduled_at).toLocaleString()}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Follow-ups" description="Monitor follow-up activity across all freelancers." />

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.value || 'all'}
            onClick={() => setTab(t.value)}
            className={`shrink-0 -mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.value ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search by client or lead number" />
        <Select id="typeFilter" options={TYPE_OPTIONS} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
        <Select id="priorityFilter" options={PRIORITY_OPTIONS} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} />
        <Select
          id="freelancerFilter"
          options={[{ value: '', label: 'All Freelancers' }, ...freelancers.map((f) => ({ value: String(f.id), label: f.full_name }))]}
          value={freelancerFilter}
          onChange={(e) => setFreelancerFilter(e.target.value)}
        />
      </FilterBar>

      {!isLoading && followUps.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No follow-ups here" description="Follow-ups matching this view will appear here." />
      ) : (
        <Table columns={columns} data={followUps} isLoading={isLoading} emptyMessage="No follow-ups found." rowKey="id" />
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />
    </div>
  )
}
