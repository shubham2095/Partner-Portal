import { useEffect, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { CalendarClock, AlertTriangle } from 'lucide-react'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Button, Badge, Modal, ConfirmDialog, ErrorState, PageHeader, EmptyState } from '../../components/ui'
import { Select, Input, Textarea } from '../../components/forms'
import {
  listMyFollowUps,
  updateFollowUp,
  completeFollowUp,
  cancelFollowUp,
} from '../../services/freelancerLeadService'

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
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [rescheduling, setRescheduling] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [cancelling, setCancelling] = useState(null)

  const rescheduleForm = useForm()
  const completeForm = useForm({ defaultValues: { outcome: '', nextFollowUpDate: '' } })

  const loadFollowUps = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const params = {
        page,
        limit: LIMIT,
        followUpType: typeFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
      }
      if (BUCKET_VALUES.has(tab)) {
        params.bucket = tab
      } else if (tab) {
        params.status = tab
      }
      const response = await listMyFollowUps(params)
      setFollowUps(response.data.followUps)
      setTotal(response.meta.total)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [tab, typeFilter, priorityFilter, search])

  useEffect(() => {
    loadFollowUps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tab, typeFilter, priorityFilter, search])

  const openReschedule = (fu) => {
    rescheduleForm.reset({
      scheduledAt: fu.scheduled_at?.slice(0, 16).replace(' ', 'T'),
      followUpType: fu.follow_up_type,
      priority: fu.priority ?? 'MEDIUM',
      notes: fu.notes ?? '',
    })
    setRescheduling(fu)
  }

  const onReschedule = async (values) => {
    try {
      await updateFollowUp(rescheduling.id, values)
      toast.success('Follow-up rescheduled')
      setRescheduling(null)
      await loadFollowUps()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onComplete = async (values) => {
    try {
      await completeFollowUp(completing.id, values.outcome, values.nextFollowUpDate || undefined)
      toast.success('Follow-up completed')
      setCompleting(null)
      completeForm.reset()
      await loadFollowUps()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onCancel = async () => {
    try {
      await cancelFollowUp(cancelling.id)
      toast.success('Follow-up cancelled')
      setCancelling(null)
      await loadFollowUps()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (hasError) return <ErrorState title="Unable to load your follow-ups" onRetry={loadFollowUps} />

  const columns = [
    {
      key: 'client_name',
      header: 'Lead',
      render: (row) => (
        <Link to={`/freelancer/leads/${row.lead_id}`} className="text-primary hover:underline">
          {row.client_name} ({row.lead_number})
        </Link>
      ),
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
    { key: 'notes', header: 'Notes', render: (row) => row.notes || row.outcome || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.status === 'PENDING' && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => openReschedule(row)}>
              Reschedule
            </Button>
            <Button size="sm" onClick={() => setCompleting(row)}>
              Complete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCancelling(row)}>
              Cancel
            </Button>
          </div>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Follow-ups" description="Track and act on your scheduled follow-ups." />

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
      </FilterBar>

      {!isLoading && followUps.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No follow-ups here"
          description="Follow-ups you create or that are scheduled for this view will appear here."
        />
      ) : (
        <Table columns={columns} data={followUps} isLoading={isLoading} emptyMessage="No follow-ups found." rowKey="id" />
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />

      <Modal isOpen={Boolean(rescheduling)} onClose={() => setRescheduling(null)} title="Reschedule Follow-up">
        <form onSubmit={rescheduleForm.handleSubmit(onReschedule)} className="flex flex-col gap-4">
          <Input id="scheduledAt" label="New Scheduled Date/Time" type="datetime-local" {...rescheduleForm.register('scheduledAt', { required: true })} />
          <Select
            id="followUpType"
            label="Type"
            options={FOLLOWUP_TYPES.map((v) => ({ value: v, label: v.replace(/_/g, ' ') }))}
            {...rescheduleForm.register('followUpType')}
          />
          <Select
            id="priority"
            label="Priority"
            options={FOLLOWUP_PRIORITIES.map((v) => ({ value: v, label: v }))}
            {...rescheduleForm.register('priority')}
          />
          <Textarea id="notes" label="Notes" {...rescheduleForm.register('notes')} />
          <Button type="submit" isLoading={rescheduleForm.formState.isSubmitting}>
            Save
          </Button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(completing)} onClose={() => setCompleting(null)} title="Complete Follow-up">
        <form onSubmit={completeForm.handleSubmit(onComplete)} className="flex flex-col gap-4">
          <Textarea id="outcome" label="Outcome" {...completeForm.register('outcome')} />
          <Input id="nextFollowUpDate" label="Next Follow-up Date (optional)" type="datetime-local" {...completeForm.register('nextFollowUpDate')} />
          <Button type="submit" isLoading={completeForm.formState.isSubmitting}>
            Mark Complete
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={onCancel}
        title="Cancel this follow-up?"
        description="This follow-up will be marked cancelled and removed from your pending list."
        confirmLabel="Cancel Follow-up"
        isDestructive
      />
    </div>
  )
}
