import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Button, Badge, Modal, ErrorState, PageHeader } from '../../components/ui'
import { Input, Select, Textarea, Checkbox } from '../../components/forms'
import { listTests, createTest } from '../../services/adminTestService'
import { listWebinars } from '../../services/adminWebinarService'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const STATUS_VARIANTS = {
  DRAFT: 'default',
  PUBLISHED: 'info',
  ACTIVE: 'success',
  CLOSED: 'warning',
  ARCHIVED: 'default',
}

const LIMIT = 20

export default function TestListPage() {
  const [tests, setTests] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [webinarOptions, setWebinarOptions] = useState([{ value: '', label: 'No linked webinar' }])

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      webinarId: '',
      durationMinutes: 30,
      passingPercentage: 70,
      maxAttempts: 1,
      negativeMarkingEnabled: false,
      randomizeQuestions: false,
    },
  })

  const loadTests = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listTests({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: LIMIT,
      })
      setTests(response.data.tests)
      setTotal(response.meta.total)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const loadWebinarOptions = async () => {
    try {
      const response = await listWebinars({ page: 1, limit: 100 })
      setWebinarOptions([
        { value: '', label: 'No linked webinar' },
        ...response.data.webinars.map((webinar) => ({ value: String(webinar.id), label: webinar.title })),
      ])
    } catch (error) {
      // non-critical, form still works without linked webinar options
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
    loadTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter])

  useEffect(() => {
    loadWebinarOptions()
  }, [])

  const onCreate = async (values) => {
    const payload = {
      ...values,
      webinarId: values.webinarId ? Number(values.webinarId) : undefined,
      durationMinutes: Number(values.durationMinutes),
      passingPercentage: Number(values.passingPercentage),
      maxAttempts: Number(values.maxAttempts),
    }
    try {
      await createTest(payload)
      toast.success('Test created')
      setIsCreateOpen(false)
      reset()
      await loadTests()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (hasError) return <ErrorState onRetry={loadTests} />

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <Link to={`/admin/tests/${row.id}`} className="text-sm text-primary hover:underline">
          {row.title}
        </Link>
      ),
    },
    { key: 'duration_minutes', header: 'Duration (min)' },
    { key: 'passing_percentage', header: 'Passing %' },
    { key: 'max_attempts', header: 'Max Attempts' },
    { key: 'question_count', header: 'Questions' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Link to={`/admin/tests/${row.id}`} className="text-sm text-primary hover:underline">
          Manage
        </Link>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Qualification Tests"
        description="Manage tests, attached questions, and attempts."
        actions={<Button onClick={() => setIsCreateOpen(true)}>Create Test</Button>}
      />
      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search by title" />
        <Select
          id="statusFilter"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
      </FilterBar>
      <Table columns={columns} data={tests} isLoading={isLoading} emptyMessage="No tests found." />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Test">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4">
          <Input id="title" label="Title" {...register('title', { required: true })} />
          <Textarea id="description" label="Description" {...register('description')} />
          <Textarea id="instructions" label="Instructions (shown before attempt)" {...register('instructions')} />
          <Select id="webinarId" label="Linked Webinar" options={webinarOptions} {...register('webinarId')} />
          <div className="grid grid-cols-3 gap-4">
            <Input id="durationMinutes" label="Duration (minutes)" type="number" {...register('durationMinutes', { required: true })} />
            <Input id="passingPercentage" label="Passing %" type="number" step="0.01" {...register('passingPercentage', { required: true })} />
            <Input id="maxAttempts" label="Max Attempts" type="number" {...register('maxAttempts', { required: true })} />
          </div>
          <Checkbox id="negativeMarkingEnabled" label="Enable negative marking" {...register('negativeMarkingEnabled')} />
          <Checkbox id="randomizeQuestions" label="Randomize question order per attempt" {...register('randomizeQuestions')} />
          <Button type="submit" isLoading={isSubmitting}>
            Create Test
          </Button>
        </form>
      </Modal>
    </div>
  )
}
