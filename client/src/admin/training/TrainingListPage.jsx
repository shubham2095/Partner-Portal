import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Button, Badge, Modal, Card, ErrorState, PageHeader } from '../../components/ui'
import { Input, Select, Textarea } from '../../components/forms'
import {
  listTrainings,
  createTraining,
  listCategories,
  createCategory,
  updateCategory,
} from '../../services/adminTrainingService'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const ACCESS_LEVELS = ['ALL', 'VERIFIED', 'QUALIFIED', 'CERTIFIED', 'ACTIVE']

const STATUS_VARIANTS = {
  DRAFT: 'default',
  PUBLISHED: 'success',
  ARCHIVED: 'default',
}

const LIMIT = 20

export default function TrainingListPage() {
  const [trainings, setTrainings] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

  const [categories, setCategories] = useState([])

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()
  const categoryForm = useForm({ defaultValues: { name: '', description: '' } })

  const loadCategories = async () => {
    try {
      const rows = await listCategories({ status: 'ACTIVE' })
      setCategories(rows)
    } catch (error) {
      // handled by interceptor toast
    }
  }

  const loadTrainings = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listTrainings({
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      })
      setTrainings(response.data.trainings)
      setTotal(response.meta.total)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, categoryFilter])

  useEffect(() => {
    loadTrainings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, categoryFilter])

  const onCreate = async (values) => {
    try {
      await createTraining(values)
      toast.success('Training created')
      setIsCreateOpen(false)
      reset()
      await loadTrainings()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onCreateCategory = async (values) => {
    try {
      await createCategory(values)
      toast.success('Category created')
      categoryForm.reset()
      await loadCategories()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onToggleCategoryStatus = async (category) => {
    try {
      await updateCategory(category.id, { status: category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
      await loadCategories()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (hasError) return <ErrorState onRetry={loadTrainings} />

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]))

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <Link to={`/admin/training/${row.id}`} className="text-primary hover:underline">
          {row.title}
        </Link>
      ),
    },
    { key: 'category', header: 'Category', render: (row) => categoryNameById.get(row.category_id) ?? '—' },
    {
      key: 'access_level',
      header: 'Access Level',
      render: (row) => <Badge variant="info">{row.access_level}</Badge>,
    },
    { key: 'total_modules', header: 'Modules' },
    { key: 'total_lessons', header: 'Lessons' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Link to={`/admin/training/${row.id}`} className="text-sm text-primary hover:underline">
          Manage
        </Link>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Training Library"
        description="Manage courses, modules, lessons, materials and videos."
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsCategoriesOpen(true)}>
              Manage Categories
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>Create Training</Button>
          </>
        }
      />

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search by title" />
        <Select
          id="statusFilter"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
        <Select
          id="categoryFilter"
          options={[{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        />
      </FilterBar>

      <Table columns={columns} data={trainings} isLoading={isLoading} emptyMessage="No trainings found." />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Training">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4">
          <Input id="title" label="Title" {...register('title', { required: true })} />
          <Textarea id="description" label="Description" {...register('description')} />
          <Select
            id="categoryId"
            label="Category"
            options={[{ value: '', label: 'No category' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
            {...register('categoryId')}
          />
          <Select
            id="accessLevel"
            label="Access Level (minimum freelancer status required)"
            options={ACCESS_LEVELS.map((value) => ({ value, label: value }))}
            {...register('accessLevel')}
          />
          <Input id="thumbnailUrl" label="Thumbnail URL" {...register('thumbnailUrl')} />
          <Button type="submit" isLoading={isSubmitting}>
            Create Training
          </Button>
        </form>
      </Modal>

      <Modal isOpen={isCategoriesOpen} onClose={() => setIsCategoriesOpen(false)} title="Manage Categories">
        <div className="flex flex-col gap-4">
          <form onSubmit={categoryForm.handleSubmit(onCreateCategory)} className="flex flex-col gap-3">
            <Input id="categoryName" label="Category Name" {...categoryForm.register('name', { required: true })} />
            <Textarea id="categoryDescription" label="Description" {...categoryForm.register('description')} />
            <Button type="submit" size="sm" isLoading={categoryForm.formState.isSubmitting}>
              Add Category
            </Button>
          </form>
          <Card className="flex flex-col gap-2">
            {categories.length === 0 && <p className="text-sm text-text-secondary">No categories yet.</p>}
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">{category.name}</p>
                  <Badge variant={category.status === 'ACTIVE' ? 'success' : 'default'}>{category.status}</Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onToggleCategoryStatus(category)}>
                  {category.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ))}
          </Card>
        </div>
      </Modal>
    </div>
  )
}
