import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Badge, Card, ProgressBar, LoadingState, ErrorState } from '../../components/ui'
import { getTrainingDetail } from '../../services/freelancerTrainingService'

const PROGRESS_VARIANTS = {
  NOT_STARTED: 'default',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
}

export default function TrainingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [training, setTraining] = useState(null)
  const [modules, setModules] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [status, setStatus] = useState('loading')

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const detail = await getTrainingDetail(id)
      setTraining(detail.training)
      setModules(detail.modules)
      setEnrollment(detail.enrollment)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (status === 'loading') return <LoadingState label="Loading course..." />
  if (status === 'error') return <ErrorState onRetry={loadDetail} />

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/freelancer/training')} className="w-fit">
        ← Back to Training Library
      </Button>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text-primary">{training.title}</h2>
        {training.description && <p className="text-sm text-text-secondary">{training.description}</p>}
        <div className="flex flex-col gap-1">
          <ProgressBar value={Number(enrollment?.progress_percentage ?? 0)} />
          <span className="text-xs text-text-secondary">
            {enrollment?.status === 'COMPLETED' ? 'Completed' : 'In progress'} — {enrollment?.progress_percentage ?? 0}%
          </span>
        </div>
      </Card>

      {modules.map((module_) => (
        <Card key={module_.id} className="flex flex-col gap-2">
          <h3 className="font-medium text-text-primary">{module_.title}</h3>
          {module_.description && <p className="text-sm text-text-secondary">{module_.description}</p>}
          <div className="flex flex-col gap-1">
            {module_.lessons.map((lesson) => (
              <Link
                key={lesson.id}
                to={`/freelancer/training/${id}/lessons/${lesson.id}`}
                className="flex items-center justify-between rounded border border-border p-3 hover:bg-surface-muted"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">{lesson.title}</span>
                  <Badge variant="info">{lesson.lesson_type}</Badge>
                </div>
                <Badge variant={PROGRESS_VARIANTS[lesson.progress?.status ?? 'NOT_STARTED']}>
                  {(lesson.progress?.status ?? 'NOT_STARTED').replace('_', ' ')}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
