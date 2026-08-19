import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, Badge, Card, LoadingState, ErrorState } from '../../components/ui'
import {
  getTrainingDetail,
  markLessonComplete,
  saveVideoProgress,
  downloadMaterial,
} from '../../services/freelancerTrainingService'

const PROGRESS_SAVE_INTERVAL_MS = 10000

function isEmbeddableUrl(url) {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url)
}

export default function LessonPage() {
  const { trainingId, lessonId } = useParams()
  const navigate = useNavigate()
  const [training, setTraining] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isMarking, setIsMarking] = useState(false)
  const videoRef = useRef(null)
  const lastSavedRef = useRef(0)

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const detail = await getTrainingDetail(trainingId)
      setTraining(detail.training)
      const found = detail.modules.flatMap((m) => m.lessons).find((l) => String(l.id) === String(lessonId))
      if (!found) {
        setStatus('error')
        return
      }
      setLesson(found)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingId, lessonId])

  const video = lesson?.lesson_type === 'VIDEO' ? lesson.content[0] : null
  const embeddable = useMemo(() => (video ? isEmbeddableUrl(video.video_url) : false), [video])

  const handleTimeUpdate = async () => {
    const element = videoRef.current
    if (!element || !video) return
    const position = Math.floor(element.currentTime)
    if (position - lastSavedRef.current < PROGRESS_SAVE_INTERVAL_MS / 1000) return
    lastSavedRef.current = position
    try {
      await saveVideoProgress(video.id, position)
    } catch (error) {
      // best-effort progress save
    }
  }

  const handleEnded = async () => {
    if (!video) return
    try {
      await saveVideoProgress(video.id, Math.floor(video.duration_seconds ?? videoRef.current?.currentTime ?? 0))
      toast.success('Video completed')
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleMarkComplete = async () => {
    setIsMarking(true)
    try {
      await markLessonComplete(lesson.id)
      toast.success('Lesson marked as complete')
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsMarking(false)
    }
  }

  const handleDownload = async (material) => {
    try {
      await downloadMaterial(material.id, material.original_filename ?? material.title)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (status === 'loading') return <LoadingState label="Loading lesson..." />
  if (status === 'error') return <ErrorState onRetry={loadDetail} />

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/freelancer/training/${trainingId}`)} className="w-fit">
        ← Back to {training.title}
      </Button>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{lesson.title}</h2>
          <Badge variant={lesson.progress?.status === 'COMPLETED' ? 'success' : 'info'}>
            {(lesson.progress?.status ?? 'NOT_STARTED').replace('_', ' ')}
          </Badge>
        </div>
        {lesson.description && <p className="text-sm text-text-secondary">{lesson.description}</p>}

        {lesson.lesson_type === 'VIDEO' && video && (
          <div className="flex flex-col gap-3">
            {embeddable ? (
              <iframe
                src={video.video_url}
                title={video.title}
                className="aspect-video w-full rounded border border-border"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                src={video.video_url}
                controls
                className="w-full rounded border border-border"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
              />
            )}
            <Button onClick={handleMarkComplete} isLoading={isMarking} disabled={lesson.progress?.status === 'COMPLETED'}>
              {lesson.progress?.status === 'COMPLETED' ? 'Completed' : 'Mark as Complete'}
            </Button>
          </div>
        )}

        {lesson.lesson_type === 'MATERIAL' && (
          <div className="flex flex-col gap-3">
            {lesson.content.length === 0 && <p className="text-sm text-text-secondary">No materials attached.</p>}
            {lesson.content.map((material) => (
              <div key={material.id} className="flex items-center justify-between rounded border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{material.title}</p>
                  <Badge variant="default">{material.material_type}</Badge>
                </div>
                <Button size="sm" onClick={() => handleDownload(material)}>
                  Download
                </Button>
              </div>
            ))}
            <Button onClick={handleMarkComplete} isLoading={isMarking} disabled={lesson.progress?.status === 'COMPLETED'}>
              {lesson.progress?.status === 'COMPLETED' ? 'Completed' : 'Mark as Complete'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
