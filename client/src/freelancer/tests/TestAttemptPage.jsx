import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, Badge, ConfirmDialog, ProgressBar, LoadingState, ErrorState } from '../../components/ui'
import { cn } from '../../utils/cn'
import { getAttemptSession, saveAnswer, submitAttempt } from '../../services/attemptService'

function formatTime(totalSeconds) {
  const seconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export default function TestAttemptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [test, setTest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submittedRef = useRef(false)

  const loadSession = useCallback(async () => {
    setStatus('loading')
    try {
      const session = await getAttemptSession(id)
      setTest(session.test)
      setQuestions(session.questions)
      setRemainingSeconds(session.attempt.remainingSeconds ?? 0)
      const initialAnswers = {}
      session.questions.forEach((question) => {
        if (question.selectedAnswer) initialAnswers[question.id] = question.selectedAnswer
      })
      setAnswers(initialAnswers)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }, [id])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setIsSubmitting(true)
    try {
      await submitAttempt(id)
      navigate(`/freelancer/attempts/${id}/result`, { replace: true })
    } catch (error) {
      submittedRef.current = false
      setIsSubmitting(false)
    }
  }, [id, navigate])

  useEffect(() => {
    if (status !== 'ready' || submittedRef.current) return undefined
    if (remainingSeconds <= 0) {
      toast.error('Time is up. Submitting your test.')
      handleSubmit()
      return undefined
    }
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [status, remainingSeconds, handleSubmit])

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (status === 'ready' && !submittedRef.current) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [status])

  const handleSelect = async (questionId, optionKey) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }))
    try {
      await saveAnswer(id, { questionId, selectedAnswer: optionKey })
    } catch (error) {
      toast.error('Failed to save answer, please retry')
    }
  }

  if (status === 'loading') return <LoadingState label="Loading your test..." />
  if (status === 'error') return <ErrorState onRetry={loadSession} />

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const isLowTime = remainingSeconds <= 60

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-6 py-4 shadow-card">
        <div>
          <h1 className="text-base font-semibold text-text-primary">{test.title}</h1>
          <p className="text-xs text-text-secondary">
            Question {currentIndex + 1} of {questions.length} · Answered {answeredCount}/{questions.length}
          </p>
        </div>
        <div className={cn('rounded-md px-3 py-1 text-sm font-semibold', isLowTime ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary')}>
          {formatTime(remainingSeconds)}
        </div>
      </header>

      <div className="px-6 pt-4">
        <ProgressBar value={answeredCount} max={questions.length} />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
        {currentQuestion && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="info">{currentQuestion.difficulty}</Badge>
              <span className="text-xs text-text-secondary">{currentQuestion.marks} mark(s)</span>
            </div>
            <p className="text-base font-medium text-text-primary">{currentQuestion.question_text}</p>
            <div className="flex flex-col gap-2">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.key}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3 text-sm transition-colors',
                    answers[currentQuestion.id] === option.key
                      ? 'border-primary bg-primary/5 text-text-primary'
                      : 'text-text-secondary hover:border-primary/40'
                  )}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    className="h-4 w-4 text-primary focus-ring"
                    checked={answers[currentQuestion.id] === option.key}
                    onChange={() => handleSelect(currentQuestion.id, option.key)}
                  />
                  <span className="font-medium">{option.key}.</span>
                  <span>{option.text}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <Button variant="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>
            Previous
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex((i) => i + 1)}>Next</Button>
          ) : (
            <Button onClick={() => setIsSubmitOpen(true)}>Submit Test</Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-4">
          {questions.map((question, index) => (
            <button
              key={question.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition-colors',
                index === currentIndex
                  ? 'border-primary bg-primary text-white'
                  : answers[question.id]
                    ? 'border-success/40 bg-success/10 text-success'
                    : 'border-border text-text-secondary'
              )}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="pt-4">
          <Button variant="danger" onClick={() => setIsSubmitOpen(true)}>
            Submit Test
          </Button>
        </div>
      </main>

      <ConfirmDialog
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onConfirm={() => {
          setIsSubmitOpen(false)
          handleSubmit()
        }}
        title="Submit Test"
        description={`You have answered ${answeredCount} of ${questions.length} question(s). Once submitted, you cannot make further changes. Are you sure you want to submit?`}
        confirmLabel={isSubmitting ? 'Submitting...' : 'Submit Test'}
        isDestructive
      />
    </div>
  )
}
