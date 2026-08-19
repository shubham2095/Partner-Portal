import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Button, Badge, Modal, ErrorState } from '../../components/ui'
import { Input, Select, Textarea } from '../../components/forms'
import { listLeads, createLead } from '../../services/adminLeadService'
import { LEAD_STATUSES, STATUS_VARIANTS } from '../../utils/leadConstants'

const STATUS_OPTIONS = [{ value: '', label: 'All Statuses' }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))]

const LIMIT = 20

export default function LeadListPage() {
  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [unassignedOnly, setUnassignedOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const loadLeads = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listLeads({
        status: statusFilter || undefined,
        unassigned: unassignedOnly || undefined,
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
  }, [search, statusFilter, unassignedOnly])

  useEffect(() => {
    loadLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, unassignedOnly])

  const onCreate = async (values) => {
    try {
      await createLead(values)
      toast.success('Lead created')
      setIsCreateOpen(false)
      reset()
      await loadLeads()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (hasError) return <ErrorState onRetry={loadLeads} />

  const columns = [
    {
      key: 'lead_number',
      header: 'Lead',
      render: (row) => (
        <Link to={`/admin/leads/${row.id}`} className="text-primary hover:underline">
          {row.lead_number ?? `#${row.id}`}
        </Link>
      ),
    },
    { key: 'client_name', header: 'Client', render: (row) => `${row.client_name}${row.company ? ` (${row.company})` : ''}` },
    { key: 'mobile', header: 'Mobile' },
    { key: 'source', header: 'Source', render: (row) => row.source ?? '—' },
    {
      key: 'assigned_freelancer_name',
      header: 'Assigned To',
      render: (row) => row.assigned_freelancer_name ?? <span className="text-text-secondary">Unassigned</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status.replace(/_/g, ' ')}</Badge>,
    },
    { key: 'expected_value', header: 'Expected Value', render: (row) => (row.expected_value ? `₹${row.expected_value}` : '—') },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Leads</h2>
          <p className="text-sm text-text-secondary">Manage leads, assignment and the sales pipeline.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Create Lead</Button>
      </div>

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search name, mobile, email, lead number" />
        <Select id="statusFilter" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={unassignedOnly} onChange={(e) => setUnassignedOnly(e.target.checked)} />
          Unassigned only
        </label>
      </FilterBar>

      <Table columns={columns} data={leads} isLoading={isLoading} emptyMessage="No leads found." />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Lead">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4">
          <Input id="clientName" label="Client Name" {...register('clientName', { required: true })} />
          <Input id="company" label="Company" {...register('company')} />
          <Input id="mobile" label="Mobile" {...register('mobile', { required: true })} />
          <Input id="email" label="Email" {...register('email')} />
          <Input id="location" label="Location" {...register('location')} />
          <Input id="businessCategory" label="Business Category" {...register('businessCategory')} />
          <Input id="serviceInterested" label="Service Interested" {...register('serviceInterested')} />
          <Input id="source" label="Source" {...register('source')} />
          <Input id="expectedValue" label="Expected Value" type="number" {...register('expectedValue')} />
          <Textarea id="notes" label="Notes" {...register('notes')} />
          <Button type="submit" isLoading={isSubmitting}>
            Create Lead
          </Button>
        </form>
      </Modal>
    </div>
  )
}
