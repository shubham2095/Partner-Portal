import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Button, Badge, Modal, ErrorState, PageHeader } from '../../components/ui'
import { Input, Select, Textarea } from '../../components/forms'
import { listMyLeads, createLead } from '../../services/freelancerLeadService'
import { LEAD_STATUSES, STATUS_VARIANTS } from '../../utils/leadConstants'

const STATUS_OPTIONS = [{ value: '', label: 'All Statuses' }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))]
const FOLLOWUP_TYPES = ['PHONE_CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'VIDEO_CALL', 'SITE_VISIT', 'DEMO', 'OTHER']

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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

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

  const openCreate = () => {
    setDuplicateWarning(null)
    reset()
    setIsCreateOpen(true)
  }

  const onCreate = async (values) => {
    setDuplicateWarning(null)
    try {
      await createLead(values)
      toast.success('Lead created')
      setIsCreateOpen(false)
      reset()
      await loadLeads()
    } catch (error) {
      if (error.response?.status === 409) {
        setDuplicateWarning(error.response.data.errors)
        return
      }
      // apiClient interceptor already surfaces an error toast for other statuses
    }
  }

  if (hasError) return <ErrorState title="Unable to load your leads" onRetry={loadLeads} />

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
      <PageHeader
        title="My Leads"
        description="Leads assigned to you."
        actions={<Button onClick={openCreate}>Create Lead</Button>}
      />

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search name, mobile, email" />
        <Select id="statusFilter" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
      </FilterBar>

      <Table columns={columns} data={leads} isLoading={isLoading} emptyMessage="No leads assigned yet." />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Lead">
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
                        to={`/freelancer/leads/${match.id}`}
                        className="font-medium text-primary hover:underline"
                        onClick={() => setIsCreateOpen(false)}
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
          <Input id="serviceInterested" label="Required Service" {...register('serviceInterested')} />
          <Input id="expectedValue" label="Estimated Budget" type="number" {...register('expectedValue')} />
          <Input id="source" label="Lead Source" {...register('source')} />
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
