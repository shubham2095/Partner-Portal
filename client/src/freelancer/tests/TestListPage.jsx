import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, Pagination } from '../../components/data-display'
import { Badge, Card, ErrorState } from '../../components/ui'
import { listAvailableTests, listMyAttempts } from '../../services/freelancerTestService'

const STATUS_VARIANTS = {
  IN_PROGRESS: 'info',
  EVALUATED: 'success',
  EXPIRED: 'danger',
  NOT_STARTED: 'default',
  PASS: 'success',
  FAIL: 'danger',
}

const LIMIT = 20

export default function TestListPage() {
  const [tests, setTests] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [myAttempts, setMyAttempts] = useState([])

  const loadTests = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listAvailableTests({ page, limit: LIMIT })
      setTests(response.data.tests)
      setTotal(response.meta.total)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMyAttempts = async () => {
    try {
      const attempts = await listMyAttempts()
      setMyAttempts(attempts)
    } catch (error) {
      // handled by interceptor toast
    }
  }

  useEffect(() => {
    loadTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    loadMyAttempts()
  }, [])

  if (hasError) return <ErrorState onRetry={loadTests} />

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'duration_minutes', header: 'Duration (min)' },
    { key: 'passing_percentage', header: 'Passing %' },
    { key: 'attemptsUsed', header: 'Attempts Used', render: (row) => `${row.attemptsUsed} / ${row.max_attempts}` },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Link to={`/freelancer/tests/${row.id}`} className="text-sm text-primary hover:underline">
          {row.attemptsRemaining > 0 ? 'View & Start' : 'View'}
        </Link>
      ),
    },
  ]

  const attemptColumns = [
    { key: 'test_title', header: 'Test' },
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
      key: 'actions',
      header: '',
      render: (row) =>
        row.status === 'EVALUATED' ? (
          <Link to={`/freelancer/attempts/${row.id}/result`} className="text-sm text-primary hover:underline">
            View Result
          </Link>
        ) : row.status === 'IN_PROGRESS' ? (
          <Link to={`/freelancer/attempts/${row.id}`} className="text-sm text-primary hover:underline">
            Resume
          </Link>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Qualification Tests</h2>
        <p className="text-sm text-text-secondary">Take available qualification tests to earn certification.</p>
      </div>
      <Table columns={columns} data={tests} isLoading={isLoading} emptyMessage="No tests available right now." />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">My Attempts</h3>
        <Table columns={attemptColumns} data={myAttempts} emptyMessage="You haven't attempted any tests yet." />
      </Card>
    </div>
  )
}
