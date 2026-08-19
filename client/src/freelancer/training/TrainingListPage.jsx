import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge, ProgressBar, LoadingState, ErrorState, EmptyState } from '../../components/ui'
import { listTrainings } from '../../services/freelancerTrainingService'

const ACCESS_LABELS = {
  ALL: 'Open to all',
  VERIFIED: 'Verified freelancers',
  QUALIFIED: 'Qualified freelancers',
  CERTIFIED: 'Certified freelancers',
  ACTIVE: 'Active freelancers',
}

export default function TrainingListPage() {
  const [trainings, setTrainings] = useState([])
  const [status, setStatus] = useState('loading')

  const loadTrainings = async () => {
    setStatus('loading')
    try {
      const response = await listTrainings({ page: 1, limit: 50 })
      setTrainings(response.data.trainings)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadTrainings()
  }, [])

  if (status === 'loading') return <LoadingState label="Loading training library..." />
  if (status === 'error') return <ErrorState onRetry={loadTrainings} />

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Training Library</h2>
        <p className="text-sm text-text-secondary">Courses, materials and videos available for your account.</p>
      </div>

      {trainings.length === 0 && (
        <EmptyState
          title="No training available yet"
          description="Check back later — new courses are added regularly."
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trainings.map((training) => (
          <Link key={training.id} to={`/freelancer/training/${training.id}`}>
            <Card className="flex h-full flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-text-primary">{training.title}</h3>
                <Badge variant="info">{ACCESS_LABELS[training.access_level] ?? training.access_level}</Badge>
              </div>
              {training.description && <p className="text-sm text-text-secondary line-clamp-2">{training.description}</p>}
              <p className="text-xs text-text-secondary">
                {training.total_modules} modules · {training.total_lessons} lessons
              </p>
              <div className="mt-auto flex flex-col gap-1">
                <ProgressBar value={Number(training.progress?.progress_percentage ?? 0)} />
                <span className="text-xs text-text-secondary">
                  {training.progress
                    ? `${training.progress.status === 'COMPLETED' ? 'Completed' : 'In progress'} — ${training.progress.progress_percentage}%`
                    : 'Not started'}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
