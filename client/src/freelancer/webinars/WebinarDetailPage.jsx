import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, Badge, Card, LoadingState, ErrorState } from '../../components/ui'
import { getWebinarDetail, registerForWebinar } from '../../services/freelancerWebinarService'

const STATUS_VARIANTS = {
  DRAFT: 'default',
  PUBLISHED: 'info',
  LIVE: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  ARCHIVED: 'default',
  REGISTERED: 'default',
  ATTENDED: 'success',
  ABSENT: 'danger',
}

export default function WebinarDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [webinar, setWebinar] = useState(null)
  const [registration, setRegistration] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isBusy, setIsBusy] = useState(false)

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const data = await getWebinarDetail(id)
      setWebinar(data.webinar)
      setRegistration(data.registration)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleRegister = async () => {
    setIsBusy(true)
    try {
      await registerForWebinar(id)
      toast.success('Registered for webinar')
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsBusy(false)
    }
  }

  if (status === 'loading') return <LoadingState label="Loading webinar..." />
  if (status === 'error') return <ErrorState onRetry={loadDetail} />

  const canRegister = !registration && ['PUBLISHED', 'LIVE'].includes(webinar.status)

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/freelancer/webinars')} className="w-fit">
        ← Back to Webinars
      </Button>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{webinar.title}</h2>
            <p className="text-sm text-text-secondary">
              {webinar.scheduled_at ? new Date(webinar.scheduled_at).toLocaleString() : '—'} · Speaker:{' '}
              {webinar.speaker_name ?? '—'}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[webinar.status] ?? 'default'}>{webinar.status}</Badge>
        </div>

        {webinar.description && <p className="text-sm text-text-secondary">{webinar.description}</p>}
        {webinar.speaker_bio && <p className="text-sm text-text-secondary">Speaker bio: {webinar.speaker_bio}</p>}

        {registration && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-text-secondary">Your status:</span>
            <Badge variant={STATUS_VARIANTS[registration.status] ?? 'default'}>{registration.status}</Badge>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {canRegister && (
            <Button size="sm" isLoading={isBusy} onClick={handleRegister}>
              Register for Webinar
            </Button>
          )}
          {registration && webinar.meeting_url && ['LIVE', 'PUBLISHED'].includes(webinar.status) && (
            <a href={webinar.meeting_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="secondary">
                Join Meeting
              </Button>
            </a>
          )}
          {webinar.recording_url && (
            <a href={webinar.recording_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="secondary">
                Watch Recording
              </Button>
            </a>
          )}
          {webinar.training_material_url && (
            <a href={webinar.training_material_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="secondary">
                Training Material
              </Button>
            </a>
          )}
        </div>
      </Card>
    </div>
  )
}
