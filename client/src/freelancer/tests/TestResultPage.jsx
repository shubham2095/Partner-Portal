import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Table } from '../../components/data-display'
import { Button, Badge, Card, LoadingState, ErrorState } from '../../components/ui'
import { getAttemptResult } from '../../services/attemptService'

const RESULT_VARIANTS = { PASS: 'success', FAIL: 'danger' }

export default function TestResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('loading')

  const loadResult = async () => {
    setStatus('loading')
    try {
      const data = await getAttemptResult(id)
      setResult(data)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadResult()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (status === 'loading') return <LoadingState label="Loading result..." />
  if (status === 'error') return <ErrorState onRetry={loadResult} />

  const { attempt, test, answers } = result

  const columns = [
    { key: 'questionId', header: 'Question ID' },
    { key: 'selectedAnswer', header: 'Your Answer', render: (row) => row.selectedAnswer ?? 'Not answered' },
    {
      key: 'isCorrect',
      header: 'Correct',
      render: (row) => <Badge variant={row.isCorrect ? 'success' : 'danger'}>{row.isCorrect ? 'Yes' : 'No'}</Badge>,
    },
    { key: 'marksAwarded', header: 'Marks Awarded' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/freelancer/tests')} className="w-fit">
        ← Back to Tests
      </Button>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{test.title}</h2>
            <p className="text-sm text-text-secondary">Attempt #{attempt.attemptNumber}</p>
          </div>
          <Badge variant={RESULT_VARIANTS[attempt.result] ?? 'default'}>{attempt.result}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary sm:grid-cols-4">
          <span>Score: {attempt.score} / {test.totalMarks}</span>
          <span>Percentage: {attempt.percentage}%</span>
          <span>Passing: {test.passingPercentage}%</span>
          <span>Submitted: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '—'}</span>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Answer Breakdown</h3>
        <Table columns={columns} data={answers} rowKey="questionId" emptyMessage="No answers recorded." />
      </Card>
    </div>
  )
}
