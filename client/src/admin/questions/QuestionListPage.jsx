import { useEffect, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Button, Badge, Modal, ErrorState, PageHeader } from '../../components/ui'
import { Input, Select, Textarea } from '../../components/forms'
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  setQuestionStatus,
} from '../../services/adminQuestionService'

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'All Difficulties' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const STATUS_VARIANTS = { ACTIVE: 'success', INACTIVE: 'default' }
const DIFFICULTY_VARIANTS = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' }

const LIMIT = 20

function toFormValues(question) {
  return {
    questionText: question?.question_text ?? '',
    category: question?.category ?? '',
    difficulty: question?.difficulty ?? 'EASY',
    marks: question?.marks ?? 1,
    negativeMarks: question?.negative_marks ?? 0,
    explanation: question?.explanation ?? '',
    correctAnswer: question?.correct_answer ?? '',
    options: question?.options?.length ? question.options : [{ key: 'A', text: '' }, { key: 'B', text: '' }],
  }
}

function QuestionFormModal({ isOpen, onClose, question, onSaved }) {
  const { register, control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: toFormValues(question),
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'options' })
  const options = watch('options')

  useEffect(() => {
    if (isOpen) reset(toFormValues(question))
  }, [isOpen, question, reset])

  const onSubmit = async (values) => {
    const payload = { ...values, marks: Number(values.marks), negativeMarks: Number(values.negativeMarks) }
    try {
      if (question) {
        await updateQuestion(question.id, payload)
        toast.success('Question updated')
      } else {
        await createQuestion(payload)
        toast.success('Question created')
      }
      onSaved()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={question ? 'Edit Question' : 'Create Question'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Textarea id="questionText" label="Question Text" {...register('questionText', { required: true })} />
        <div className="grid grid-cols-2 gap-4">
          <Input id="category" label="Category" {...register('category')} />
          <Select
            id="difficulty"
            label="Difficulty"
            options={[
              { value: 'EASY', label: 'Easy' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HARD', label: 'Hard' },
            ]}
            {...register('difficulty')}
          />
          <Input id="marks" label="Marks" type="number" step="0.5" {...register('marks')} />
          <Input id="negativeMarks" label="Negative Marks" type="number" step="0.5" {...register('negativeMarks')} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-primary">Options</span>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input
                id={`options.${index}.key`}
                placeholder="Key"
                className="w-16"
                {...register(`options.${index}.key`, { required: true })}
              />
              <Input
                id={`options.${index}.text`}
                placeholder="Option text"
                className="flex-1"
                {...register(`options.${index}.text`, { required: true })}
              />
              {fields.length > 2 && (
                <Button type="button" variant="danger" size="sm" onClick={() => remove(index)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-fit"
            onClick={() => append({ key: '', text: '' })}
          >
            Add Option
          </Button>
        </div>

        <Select
          id="correctAnswer"
          label="Correct Answer"
          placeholder="Select the correct option"
          options={(options ?? []).filter((option) => option.key).map((option) => ({ value: option.key, label: `${option.key} — ${option.text || ''}` }))}
          {...register('correctAnswer', { required: true })}
        />

        <Textarea id="explanation" label="Explanation (shown after evaluation)" {...register('explanation')} />

        <Button type="submit" isLoading={isSubmitting}>
          {question ? 'Save Changes' : 'Create Question'}
        </Button>
      </form>
    </Modal>
  )
}

export default function QuestionListPage() {
  const [questions, setQuestions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [formTarget, setFormTarget] = useState(undefined)

  const loadQuestions = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listQuestions({
        search: search || undefined,
        difficulty: difficultyFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: LIMIT,
      })
      setQuestions(response.data.questions)
      setTotal(response.meta.total)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search, difficultyFilter, statusFilter])

  useEffect(() => {
    loadQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, difficultyFilter, statusFilter])

  const handleToggleStatus = async (question) => {
    try {
      await setQuestionStatus(question.id, question.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
      toast.success('Question status updated')
      await loadQuestions()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (hasError) return <ErrorState onRetry={loadQuestions} />

  const columns = [
    {
      key: 'question_text',
      header: 'Question',
      render: (row) => <span className="line-clamp-2 max-w-md">{row.question_text}</span>,
    },
    { key: 'category', header: 'Category', render: (row) => row.category ?? '—' },
    {
      key: 'difficulty',
      header: 'Difficulty',
      render: (row) => <Badge variant={DIFFICULTY_VARIANTS[row.difficulty] ?? 'default'}>{row.difficulty}</Badge>,
    },
    { key: 'marks', header: 'Marks' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setFormTarget(row)}>
            Edit
          </Button>
          <Button size="sm" variant={row.status === 'ACTIVE' ? 'danger' : 'primary'} onClick={() => handleToggleStatus(row)}>
            {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Question Bank"
        description="Manage MCQ questions used across qualification tests."
        actions={<Button onClick={() => setFormTarget(null)}>Create Question</Button>}
      />
      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search question text" />
        <Select
          id="difficultyFilter"
          options={DIFFICULTY_OPTIONS}
          value={difficultyFilter}
          onChange={(event) => setDifficultyFilter(event.target.value)}
        />
        <Select
          id="statusFilter"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
      </FilterBar>
      <Table columns={columns} data={questions} isLoading={isLoading} emptyMessage="No questions found." />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />

      <QuestionFormModal
        isOpen={formTarget !== undefined}
        onClose={() => setFormTarget(undefined)}
        question={formTarget}
        onSaved={() => {
          setFormTarget(undefined)
          loadQuestions()
        }}
      />
    </div>
  )
}
