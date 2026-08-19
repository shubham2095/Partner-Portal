import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Button, Badge, Modal, ErrorState } from '../../components/ui'
import { Input, Select, Textarea } from '../../components/forms'
import { listWebinars, createWebinar } from '../../services/adminWebinarService'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'LIVE', label: 'Live' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const STATUS_VARIANTS = {
  DRAFT: 'default',
  PUBLISHED: 'info',
  LIVE: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  ARCHIVED: 'default',
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
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm()

  const loadWebinars = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listWebinars({
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

  const onCreate = async (values) => {
    try {
      await createWebinar(values)
      toast.success('Webinar created')
      setIsCreateOpen(false)
      reset()
      await loadWebinars()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

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
        <Link to={`/admin/webinars/${row.id}`} className="text-sm text-primary hover:underline">
          View
        </Link>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Webinars</h2>
          <p className="text-sm text-text-secondary">Manage webinars, registrations, and attendance.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Create Webinar</Button>
      </div>
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

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Webinar">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4">
          <Input id="title" label="Title" {...register('title', { required: true })} />
          <Textarea id="description" label="Description" {...register('description')} />
          <Input id="speakerName" label="Speaker Name" {...register('speakerName')} />
          <Textarea id="speakerBio" label="Speaker Bio" {...register('speakerBio')} />
          <Input id="scheduledAt" label="Scheduled At" type="datetime-local" {...register('scheduledAt', { required: true })} />
          <Input id="durationMinutes" label="Duration (minutes)" type="number" {...register('durationMinutes')} />
          <Input id="registrationUrl" label="Registration URL" {...register('registrationUrl')} />
          <Input id="meetingUrl" label="Meeting URL" {...register('meetingUrl')} />
          <Input id="recordingUrl" label="Recording URL" {...register('recordingUrl')} />
          <Input id="trainingMaterialUrl" label="Training Material URL" {...register('trainingMaterialUrl')} />
          <Button type="submit" isLoading={isSubmitting}>
            Create Webinar
          </Button>
        </form>
      </Modal>
    </div>
  )
}
