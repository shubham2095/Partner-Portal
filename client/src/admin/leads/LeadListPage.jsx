import { useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useListQuery } from '../../hooks/useListQuery'
import { useDisclosure } from '../../hooks/useDisclosure'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'
import { Table, Pagination, SearchBar, FilterBar, StatusChips } from '../../components/data-display'
import { Button, Badge, Modal, ErrorState, PageHeader } from '../../components/ui'
import { Input, Select, Textarea } from '../../components/forms'
import { listLeads, createLead } from '../../services/adminLeadService'
import { LEAD_STATUSES, STATUS_VARIANTS } from '../../utils/leadConstants'

const STATUS_OPTIONS = [{ value: '', label: 'All Statuses' }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))]
const FOLLOWUP_TYPES = ['PHONE_CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'VIDEO_CALL', 'SITE_VISIT', 'DEMO', 'OTHER']

// A curated subset of the 13 lead statuses for the quick-filter strip.
const CHIP_STATUSES = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'NEGOTIATION', 'CONVERTED', 'LOST']
const CHIP_OPTIONS = [
  { value: '', label: 'All' },
  ...CHIP_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) })),
]

const LIMIT = 20

async function countByStatus(status) {
  const res = await listLeads({ status: status || undefined, page: 1, limit: 1 })
  return res?.meta?.total ?? 0
}

export default function LeadListPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState('')
  const [unassignedOnly, setUnassignedOnly] = useState(false)
  const createModal = useDisclosure()
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const {
    rows: leads,
    page,
    setPage,
    totalPages,
    isLoading,
    hasError,
    reload,
  } = useListQuery(
    (params) => listLeads(params).then((r) => ({ rows: r.data.leads, total: r.meta.total })),
    {
      status: statusFilter || undefined,
      unassigned: unassignedOnly || undefined,
      search: search || undefined,
      sortBy: 'created_at',
      sortDir: 'DESC',
    },
    { limit: LIMIT }
  )

  const openCreate = () => {
    setDuplicateWarning(null)
    reset()
    createModal.open()
  }

  const onCreate = async (values) => {
    setDuplicateWarning(null)
    try {
      await createLead(values)
      toast.success('Lead created')
      createModal.close()
      reset()
      await reload()
    } catch (error) {
      if (error.response?.status === 409) {
        setDuplicateWarning(error.response.data.errors)
        return
      }
      // apiClient interceptor already surfaces an error toast for other statuses
    }
  }

  if (hasError) return <ErrorState title="Unable to load leads" onRetry={reload} />

  const columns = [
    {
      key: 'lead_number',
      header: 'Lead',
      render: (row) => (
        <Link
          to={`/admin/leads/${row.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-primary hover:underline"
        >
          {row.lead_number ?? `#${row.id}`}
        </Link>
      ),
    },
    {
      key: 'client_name',
      header: 'Client',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-text-primary">{row.client_name}</p>
          <p className="text-xs text-text-muted">{row.company || row.mobile || '—'}</p>
        </div>
      ),
    },
    { key: 'source', header: 'Source', render: (row) => row.source ?? '—' },
    {
      key: 'assigned_freelancer_name',
      header: 'Assigned To',
      render: (row) => row.assigned_freelancer_name ?? <span className="text-text-muted">Unassigned</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'} dot>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'expected_value',
      header: 'Expected Value',
      render: (row) =>
        row.expected_value ? (
          <span className="tabular-nums">₹{Number(row.expected_value).toLocaleString('en-IN')}</span>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Leads"
        description="Manage leads, assignment and the sales pipeline."
        actions={<Button onClick={openCreate}>Create Lead</Button>}
      />

      <StatusChips options={CHIP_OPTIONS} value={statusFilter} onChange={setStatusFilter} fetchCount={countByStatus} />

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search name, mobile, email, lead number" />
        <Select id="statusFilter" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={unassignedOnly} onChange={(e) => setUnassignedOnly(e.target.checked)} />
          Unassigned only
        </label>
      </FilterBar>

      <Table
        columns={columns}
        data={leads}
        isLoading={isLoading}
        emptyMessage="No leads found."
        onRowClick={(row) => navigate(`/admin/leads/${row.id}`)}
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Create Lead">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4">
          {duplicateWarning && (
            <div className="flex flex-col gap-2 rounded-md border border-warning/30 bg-warning-bg p-3 text-sm text-warning">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                Possible duplicate lead detected
              </div>
              <p>{duplicateWarning.message}</p>
              {duplicateWarning.matches?.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {duplicateWarning.matches.map((match) => (
                    <li key={match.id}>
                      <Link
                        to={`/admin/leads/${match.id}`}
                        className="font-medium text-primary hover:underline"
                        onClick={createModal.close}
                      >
                        {match.leadNumber} — {match.clientName} ({match.status})
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <Input id="clientName" label="Client Name" {...register('clientName', { required: true })} />
          <Input id="company" label="Company / Business Name" {...register('company')} />
          <Input id="mobile" label="Contact Number" {...register('mobile', { required: true })} />
          <Input id="email" label="Email" {...register('email')} />
          <Input id="location" label="City" {...register('location')} />
          <Input id="businessCategory" label="Business Category" {...register('businessCategory')} />
          <Input id="serviceInterested" label="Required Service" {...register('serviceInterested')} />
          <Input id="source" label="Lead Source" {...register('source')} />
          <Input id="expectedValue" label="Estimated Budget" type="number" {...register('expectedValue')} />
          <Textarea id="notes" label="Notes" {...register('notes')} />
          <Input id="nextFollowUpDate" label="Next Follow-up (optional)" type="datetime-local" {...register('nextFollowUpDate')} />
          <Select
            id="followUpType"
            label="Follow-up Type"
            options={FOLLOWUP_TYPES.map((value) => ({ value, label: value.replace(/_/g, ' ') }))}
            {...register('followUpType')}
          />
          <Button type="submit" isLoading={isSubmitting}>
            Create Lead
          </Button>
        </form>
      </Modal>
    </div>
  )
}
