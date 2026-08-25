import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { LifeBuoy } from 'lucide-react'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Badge, Button, Modal, ErrorState, PageHeader, EmptyState } from '../../components/ui'
import { Input, Select, Textarea, FileUpload } from '../../components/forms'
import { listMyTickets, createTicket } from '../../services/freelancerTicketService'

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

const LIMIT = 20

export default function TicketListPage() {
  const [tickets, setTickets] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState(null)

  const createForm = useForm({ defaultValues: { category: 'OTHER', subject: '', description: '', priority: 'MEDIUM' } })

  const loadTickets = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listMyTickets({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      })
      setTickets(response.data.tickets)
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
  }, [statusFilter, categoryFilter, priorityFilter, search])

  useEffect(() => {
    loadTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, categoryFilter, priorityFilter, search])

  const onCreateTicket = async (values) => {
    try {
      const formData = new FormData()
      formData.append('category', values.category)
      formData.append('subject', values.subject)
      formData.append('description', values.description)
      formData.append('priority', values.priority)
      if (attachmentFile) formData.append('attachment', attachmentFile)
      const ticket = await createTicket(formData)
      toast.success(`Ticket ${ticket.ticket_number} created`)
      setIsCreateOpen(false)
      setAttachmentFile(null)
      createForm.reset()
      await loadTickets()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (hasError) return <ErrorState title="Unable to load tickets" onRetry={loadTickets} />

  const columns = [
    {
      key: 'ticket_number',
      header: 'Ticket',
      render: (row) => (
        <Link to={`/freelancer/tickets/${row.id}`} className="text-primary hover:underline">
          {row.ticket_number}
        </Link>
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
    { key: 'updated_at', header: 'Last Updated', render: (row) => new Date(row.updated_at).toLocaleString() },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Support Tickets"
        description="Raise and track your support requests."
        actions={<Button onClick={() => setIsCreateOpen(true)}>Create Ticket</Button>}
      />

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search subject or ticket number" />
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
      </FilterBar>

      {!isLoading && tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets yet" description="Tickets you raise will appear here." />
      ) : (
        <Table columns={columns} data={tickets} isLoading={isLoading} emptyMessage="No tickets found." rowKey="id" />
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Ticket">
        <form onSubmit={createForm.handleSubmit(onCreateTicket)} className="flex flex-col gap-4">
          <Select
            id="category"
            label="Category"
            options={CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))}
            {...createForm.register('category', { required: true })}
          />
          <Input
            id="subject"
            label="Subject"
            error={createForm.formState.errors.subject?.message}
            {...createForm.register('subject', { required: 'Subject is required', maxLength: 200 })}
          />
          <Textarea
            id="description"
            label="Description"
            error={createForm.formState.errors.description?.message}
            {...createForm.register('description', { required: 'Description is required', maxLength: 5000 })}
          />
          <Select
            id="priority"
            label="Priority"
            options={PRIORITIES.map((p) => ({ value: p, label: p }))}
            {...createForm.register('priority')}
          />
          <FileUpload label="Attachment (optional)" accept=".pdf,image/*,.doc,.docx" onChange={setAttachmentFile} />
          <Button type="submit" isLoading={createForm.formState.isSubmitting}>
            Submit Ticket
          </Button>
        </form>
      </Modal>
    </div>
  )
}
