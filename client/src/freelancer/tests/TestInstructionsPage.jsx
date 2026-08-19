import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Badge, Card, LoadingState, ErrorState } from '../../components/ui'
import { getTestInstructions, startAttempt } from '../../services/freelancerTestService'

export default function TestInstructionsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isStarting, setIsStarting] = useState(false)

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const data = await getTestInstructions(id)
      setDetail(data)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleStart = async () => {
    setIsStarting(true)
    try {
      const session = await startAttempt(id)
      navigate(`/freelancer/attempts/${session.attempt.id}`)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
      setIsStarting(false)
    }
  }

  if (status === 'loading') return <LoadingState label="Loading test..." />
  if (status === 'error') return <ErrorState onRetry={loadDetail} />

  const { test, attemptsUsed, attemptsRemaining, canAttempt } = detail

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/freelancer/tests')} className="w-fit">
        ← Back to Tests
      </Button>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">{test.title}</h2>
          <Badge variant="info">{test.question_count} question(s)</Badge>
        </div>

        {test.description && <p className="text-sm text-text-secondary">{test.description}</p>}

        <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary sm:grid-cols-4">
          <span>Duration: {test.duration_minutes} min</span>
          <span>Passing: {test.passing_percentage}%</span>
          <span>Max Attempts: {test.max_attempts}</span>
          <span>Attempts Used: {attemptsUsed}</span>
        </div>

        {test.instructions && (
          <div className="rounded-md border border-border bg-surface-muted p-4 text-sm text-text-secondary">
            <p className="mb-2 font-medium text-text-primary">Instructions</p>
            <p className="whitespace-pre-line">{test.instructions}</p>
          </div>
        )}

        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-text-secondary">
          Once you start, the timer cannot be paused. Ensure you have a stable connection and {test.duration_minutes}{' '}
          uninterrupted minutes before starting.
        </div>

        <div className="pt-2">
          {canAttempt ? (
            <Button isLoading={isStarting} onClick={handleStart}>
              Start Test
            </Button>
          ) : (
            <p className="text-sm text-danger">
              You have used all {test.max_attempts} attempt(s) allowed for this test.
            </p>
          )}
          {attemptsRemaining === 0 && canAttempt && (
            <p className="mt-2 text-sm text-text-secondary">This is your last attempt.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
