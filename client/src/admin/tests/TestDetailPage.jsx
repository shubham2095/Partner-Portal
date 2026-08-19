import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Table, Pagination, FilterBar } from '../../components/data-display'
import { Button, Badge, Modal, Card, LoadingState, ErrorState } from '../../components/ui'
import { Input, Select, Textarea, Checkbox } from '../../components/forms'
import {
  getTestDetail,
  updateTest,
  changeTestStatus,
  addQuestionToTest,
  removeQuestionFromTest,
  listTestAttempts,
} from '../../services/adminTestService'
import { listQuestions } from '../../services/adminQuestionService'

const TEST_STATUSES = ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED']
const RESULT_OPTIONS = [
  { value: '', label: 'All Results' },
  { value: 'PASS', label: 'Pass' },
  { value: 'FAIL', label: 'Fail' },
]
const ATTEMPT_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'EXPIRED', label: 'Expired' },
]

const STATUS_VARIANTS = {
  DRAFT: 'default',
  PUBLISHED: 'info',
  ACTIVE: 'success',
  CLOSED: 'warning',
  ARCHIVED: 'default',
  PASS: 'success',
  FAIL: 'danger',
  IN_PROGRESS: 'info',
  SUBMITTED: 'success',
  EXPIRED: 'danger',
}

const LIMIT = 20

function toFormValues(test) {
  return {
    title: test?.title ?? '',
    description: test?.description ?? '',
    instructions: test?.instructions ?? '',
    durationMinutes: test?.duration_minutes ?? 30,
    passingPercentage: test?.passing_percentage ?? 70,
    maxAttempts: test?.max_attempts ?? 1,
    negativeMarkingEnabled: Boolean(test?.negative_marking_enabled),
    randomizeQuestions: Boolean(test?.randomize_questions),
  }
}

export default function TestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [status, setStatus] = useState('loading')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [statusValue, setStatusValue] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [availableQuestions, setAvailableQuestions] = useState([])

  const [attempts, setAttempts] = useState([])
  const [attemptsTotal, setAttemptsTotal] = useState(0)
  const [attemptsPage, setAttemptsPage] = useState(1)
  const [resultFilter, setResultFilter] = useState('')
  const [attemptStatusFilter, setAttemptStatusFilter] = useState('')

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()
  const addQuestionForm = useForm({ defaultValues: { questionId: '' } })

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const detail = await getTestDetail(id)
      setTest(detail.test)
      setQuestions(detail.questions)
      setStatusValue(detail.test.status)
      reset(toFormValues(detail.test))
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  const loadAttempts = async () => {
    try {
      const response = await listTestAttempts(id, {
        result: resultFilter || undefined,
        status: attemptStatusFilter || undefined,
        page: attemptsPage,
        limit: LIMIT,
      })
      setAttempts(response.data.attempts)
      setAttemptsTotal(response.meta.total)
    } catch (error) {
      // handled by interceptor toast
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (status === 'ready') loadAttempts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, attemptsPage, resultFilter, attemptStatusFilter])

  const onUpdate = async (values) => {
    const payload = {
      ...values,
      durationMinutes: Number(values.durationMinutes),
      passingPercentage: Number(values.passingPercentage),
      maxAttempts: Number(values.maxAttempts),
    }
    try {
      await updateTest(id, payload)
      toast.success('Test updated')
      setIsEditOpen(false)
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleStatusChange = async () => {
    setIsBusy(true)
    try {
      await changeTestStatus(id, statusValue)
      toast.success('Test status updated')
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsBusy(false)
    }
  }

  const openAddQuestion = async () => {
    setIsAddOpen(true)
    try {
      const response = await listQuestions({ status: 'ACTIVE', page: 1, limit: 100 })
      const attachedIds = new Set(questions.map((question) => question.id))
      setAvailableQuestions(
        response.data.questions
          .filter((question) => !attachedIds.has(question.id))
          .map((question) => ({ value: String(question.id), label: question.question_text.slice(0, 80) }))
      )
    } catch (error) {
      // handled by interceptor toast
    }
  }

  const onAddQuestion = async (values) => {
    try {
      const updated = await addQuestionToTest(id, Number(values.questionId))
      setQuestions(updated)
      toast.success('Question added to test')
      setIsAddOpen(false)
      addQuestionForm.reset({ questionId: '' })
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleRemoveQuestion = async (questionId) => {
    try {
      const updated = await removeQuestionFromTest(id, questionId)
      setQuestions(updated)
      toast.success('Question removed from test')
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (status === 'loading') return <LoadingState label="Loading test..." />
  if (status === 'error') return <ErrorState onRetry={loadDetail} />

  const questionColumns = [
    { key: 'question_text', header: 'Question', render: (row) => <span className="line-clamp-2 max-w-md">{row.question_text}</span> },
    { key: 'category', header: 'Category', render: (row) => row.category ?? '—' },
    { key: 'difficulty', header: 'Difficulty' },
    { key: 'marks', header: 'Marks' },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button size="sm" variant="danger" onClick={() => handleRemoveQuestion(row.id)}>
          Remove
        </Button>
      ),
    },
  ]

  const attemptColumns = [
    { key: 'full_name', header: 'Freelancer' },
    { key: 'partner_id', header: 'Partner ID', render: (row) => row.partner_id ?? '—' },
    { key: 'attempt_number', header: 'Attempt #' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
    {
      key: 'result',
      header: 'Result',
      render: (row) => (row.result ? <Badge variant={STATUS_VARIANTS[row.result] ?? 'default'}>{row.result}</Badge> : '—'),
    },
    { key: 'percentage', header: 'Score %', render: (row) => (row.percentage != null ? `${row.percentage}%` : '—') },
    {
      key: 'submitted_at',
      header: 'Submitted',
      render: (row) => (row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '—'),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tests')} className="w-fit">
        ← Back to Tests
      </Button>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{test.title}</h2>
            <p className="text-sm text-text-secondary">
              {test.duration_minutes} min · Passing {test.passing_percentage}% · Max attempts {test.max_attempts} ·{' '}
              {test.question_count} question(s)
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[test.status] ?? 'default'}>{test.status}</Badge>
        </div>

        {test.description && <p className="text-sm text-text-secondary">{test.description}</p>}

        <div className="flex flex-wrap items-end gap-2 pt-2">
          <Select
            id="statusValue"
            label="Change Status"
            options={TEST_STATUSES.map((value) => ({ value, label: value }))}
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value)}
          />
          <Button size="sm" disabled={isBusy || statusValue === test.status} onClick={handleStatusChange}>
            Update Status
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsEditOpen(true)}>
            Edit Details
          </Button>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">Questions</h3>
          <Button size="sm" onClick={openAddQuestion}>
            Add Question
          </Button>
        </div>
        <Table columns={questionColumns} data={questions} emptyMessage="No questions attached yet." />
      </Card>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Attempts</h3>
        <FilterBar>
          <Select id="resultFilter" options={RESULT_OPTIONS} value={resultFilter} onChange={(event) => setResultFilter(event.target.value)} />
          <Select
            id="attemptStatusFilter"
            options={ATTEMPT_STATUS_OPTIONS}
            value={attemptStatusFilter}
            onChange={(event) => setAttemptStatusFilter(event.target.value)}
          />
        </FilterBar>
        <Table columns={attemptColumns} data={attempts} emptyMessage="No attempts yet." />
        <Pagination page={attemptsPage} totalPages={Math.max(1, Math.ceil(attemptsTotal / LIMIT))} onPageChange={setAttemptsPage} />
      </Card>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Test">
        <form onSubmit={handleSubmit(onUpdate)} className="flex flex-col gap-4">
          <Input id="title" label="Title" {...register('title')} />
          <Textarea id="description" label="Description" {...register('description')} />
          <Textarea id="instructions" label="Instructions" {...register('instructions')} />
          <div className="grid grid-cols-3 gap-4">
            <Input id="durationMinutes" label="Duration (minutes)" type="number" {...register('durationMinutes')} />
            <Input id="passingPercentage" label="Passing %" type="number" step="0.01" {...register('passingPercentage')} />
            <Input id="maxAttempts" label="Max Attempts" type="number" {...register('maxAttempts')} />
          </div>
          <Checkbox id="negativeMarkingEnabled" label="Enable negative marking" {...register('negativeMarkingEnabled')} />
          <Checkbox id="randomizeQuestions" label="Randomize question order per attempt" {...register('randomizeQuestions')} />
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </form>
      </Modal>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Question to Test">
        <form onSubmit={addQuestionForm.handleSubmit(onAddQuestion)} className="flex flex-col gap-4">
          <Select
            id="questionId"
            label="Question"
            placeholder="Select an active question"
            options={availableQuestions}
            {...addQuestionForm.register('questionId', { required: true })}
          />
          <Button type="submit" isLoading={addQuestionForm.formState.isSubmitting} disabled={availableQuestions.length === 0}>
            Add Question
          </Button>
        </form>
      </Modal>
    </div>
  )
}
