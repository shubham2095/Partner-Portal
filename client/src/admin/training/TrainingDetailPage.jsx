import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Button, Badge, Modal, Card, ConfirmDialog, LoadingState, ErrorState } from '../../components/ui'
import { Input, Select, Textarea, FileUpload } from '../../components/forms'
import {
  getTrainingDetail,
  updateTraining,
  changeTrainingStatus,
  addModule,
  removeModule,
  addLesson,
  removeLesson,
  uploadMaterial,
  removeMaterial,
  downloadMaterial,
  addVideo,
  removeVideo,
} from '../../services/adminTrainingService'

const TRAINING_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED']
const ACCESS_LEVELS = ['ALL', 'VERIFIED', 'QUALIFIED', 'CERTIFIED', 'ACTIVE']
const LESSON_TYPES = ['VIDEO', 'MATERIAL']

function toFormValues(training) {
  return {
    title: training.title ?? '',
    description: training.description ?? '',
    categoryId: training.category_id ?? '',
    accessLevel: training.access_level ?? 'ALL',
    thumbnailUrl: training.thumbnail_url ?? '',
  }
}

export default function TrainingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [training, setTraining] = useState(null)
  const [modules, setModules] = useState([])
  const [status, setStatus] = useState('loading')
  const [statusValue, setStatusValue] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false)
  const [lessonTargetModuleId, setLessonTargetModuleId] = useState(null)
  const [videoTargetLessonId, setVideoTargetLessonId] = useState(null)
  const [materialTargetLessonId, setMaterialTargetLessonId] = useState(null)
  const [materialFile, setMaterialFile] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)

  const editForm = useForm()
  const moduleForm = useForm({ defaultValues: { title: '', description: '' } })
  const lessonForm = useForm({ defaultValues: { title: '', description: '', lessonType: 'VIDEO', durationMinutes: '' } })
  const videoForm = useForm({ defaultValues: { title: '', videoUrl: '', thumbnailUrl: '', durationSeconds: '' } })
  const materialForm = useForm({ defaultValues: { title: '' } })

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const detail = await getTrainingDetail(id)
      setTraining(detail.training)
      setModules(detail.modules)
      setStatusValue(detail.training.status)
      editForm.reset(toFormValues(detail.training))
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onUpdate = async (values) => {
    try {
      await updateTraining(id, values)
      toast.success('Training updated')
      setIsEditOpen(false)
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleStatusChange = async () => {
    setIsBusy(true)
    try {
      await changeTrainingStatus(id, statusValue)
      toast.success('Training status updated')
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsBusy(false)
    }
  }

  const onAddModule = async (values) => {
    try {
      await addModule(id, values)
      toast.success('Module added')
      setIsAddModuleOpen(false)
      moduleForm.reset()
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onAddLesson = async (values) => {
    try {
      await addLesson(lessonTargetModuleId, values)
      toast.success('Lesson added')
      setLessonTargetModuleId(null)
      lessonForm.reset()
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onAddVideo = async (values) => {
    try {
      await addVideo(videoTargetLessonId, values)
      toast.success('Video added')
      setVideoTargetLessonId(null)
      videoForm.reset()
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onAddMaterial = async (values) => {
    if (!materialFile) {
      toast.error('Please select a file to upload')
      return
    }
    try {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('material', materialFile)
      await uploadMaterial(materialTargetLessonId, formData)
      toast.success('Material uploaded')
      setMaterialTargetLessonId(null)
      setMaterialFile(null)
      materialForm.reset()
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleDownloadMaterial = async (material) => {
    try {
      const blob = await downloadMaterial(material.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = material.original_filename ?? material.title
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return
    try {
      if (confirmTarget.type === 'module') await removeModule(confirmTarget.id)
      if (confirmTarget.type === 'lesson') await removeLesson(confirmTarget.id)
      if (confirmTarget.type === 'material') await removeMaterial(confirmTarget.id)
      if (confirmTarget.type === 'video') await removeVideo(confirmTarget.id)
      toast.success('Removed')
      setConfirmTarget(null)
      await loadDetail()
    } catch (error) {
      setConfirmTarget(null)
    }
  }

  if (status === 'loading') return <LoadingState label="Loading training..." />
  if (status === 'error') return <ErrorState onRetry={loadDetail} />

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/training')} className="w-fit">
        ← Back to Training Library
      </Button>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{training.title}</h2>
            <p className="text-sm text-text-secondary">
              {training.total_modules} modules · {training.total_lessons} lessons · Access: {training.access_level}
            </p>
          </div>
          <Badge variant={training.status === 'PUBLISHED' ? 'success' : 'default'}>{training.status}</Badge>
        </div>
        {training.description && <p className="text-sm text-text-secondary">{training.description}</p>}

        <div className="flex flex-wrap items-end gap-2 pt-2">
          <Select
            id="statusValue"
            label="Change Status"
            options={TRAINING_STATUSES.map((value) => ({ value, label: value }))}
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value)}
          />
          <Button size="sm" disabled={isBusy || statusValue === training.status} onClick={handleStatusChange}>
            Update Status
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsEditOpen(true)}>
            Edit Details
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">Modules</h3>
        <Button size="sm" onClick={() => setIsAddModuleOpen(true)}>
          Add Module
        </Button>
      </div>

      {modules.length === 0 && <p className="text-sm text-text-secondary">No modules yet.</p>}

      {modules.map((module_) => (
        <Card key={module_.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-text-primary">{module_.title}</h4>
              {module_.description && <p className="text-sm text-text-secondary">{module_.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setLessonTargetModuleId(module_.id)}>
                Add Lesson
              </Button>
              <Button size="sm" variant="danger" onClick={() => setConfirmTarget({ type: 'module', id: module_.id })}>
                Delete Module
              </Button>
            </div>
          </div>

          {module_.lessons.length === 0 && <p className="text-sm text-text-secondary">No lessons yet.</p>}

          {module_.lessons.map((lesson) => (
            <div key={lesson.id} className="rounded border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{lesson.title}</span>
                  <Badge variant="info">{lesson.lesson_type}</Badge>
                </div>
                <div className="flex gap-2">
                  {lesson.lesson_type === 'VIDEO' && (
                    <Button size="sm" variant="secondary" onClick={() => setVideoTargetLessonId(lesson.id)}>
                      Add Video
                    </Button>
                  )}
                  {lesson.lesson_type === 'MATERIAL' && (
                    <Button size="sm" variant="secondary" onClick={() => setMaterialTargetLessonId(lesson.id)}>
                      Add Material
                    </Button>
                  )}
                  <Button size="sm" variant="danger" onClick={() => setConfirmTarget({ type: 'lesson', id: lesson.id })}>
                    Delete Lesson
                  </Button>
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                {lesson.content.length === 0 && <p className="text-xs text-text-secondary">No content attached.</p>}
                {lesson.lesson_type === 'VIDEO' &&
                  lesson.content.map((video) => (
                    <div key={video.id} className="flex items-center justify-between text-sm">
                      <span>{video.title} ({video.duration_seconds ? `${video.duration_seconds}s` : '—'})</span>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmTarget({ type: 'video', id: video.id })}>
                        Remove
                      </Button>
                    </div>
                  ))}
                {lesson.lesson_type === 'MATERIAL' &&
                  lesson.content.map((material) => (
                    <div key={material.id} className="flex items-center justify-between text-sm">
                      <span>
                        {material.title} <Badge variant="default">{material.material_type}</Badge>
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleDownloadMaterial(material)}>
                          Download
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmTarget({ type: 'material', id: material.id })}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </Card>
      ))}

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Training">
        <form onSubmit={editForm.handleSubmit(onUpdate)} className="flex flex-col gap-4">
          <Input id="title" label="Title" {...editForm.register('title')} />
          <Textarea id="description" label="Description" {...editForm.register('description')} />
          <Select
            id="accessLevel"
            label="Access Level"
            options={ACCESS_LEVELS.map((value) => ({ value, label: value }))}
            {...editForm.register('accessLevel')}
          />
          <Input id="thumbnailUrl" label="Thumbnail URL" {...editForm.register('thumbnailUrl')} />
          <Button type="submit" isLoading={editForm.formState.isSubmitting}>
            Save Changes
          </Button>
        </form>
      </Modal>

      <Modal isOpen={isAddModuleOpen} onClose={() => setIsAddModuleOpen(false)} title="Add Module">
        <form onSubmit={moduleForm.handleSubmit(onAddModule)} className="flex flex-col gap-4">
          <Input id="moduleTitle" label="Title" {...moduleForm.register('title', { required: true })} />
          <Textarea id="moduleDescription" label="Description" {...moduleForm.register('description')} />
          <Button type="submit" isLoading={moduleForm.formState.isSubmitting}>
            Add Module
          </Button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(lessonTargetModuleId)} onClose={() => setLessonTargetModuleId(null)} title="Add Lesson">
        <form onSubmit={lessonForm.handleSubmit(onAddLesson)} className="flex flex-col gap-4">
          <Input id="lessonTitle" label="Title" {...lessonForm.register('title', { required: true })} />
          <Textarea id="lessonDescription" label="Description" {...lessonForm.register('description')} />
          <Select
            id="lessonType"
            label="Lesson Type"
            options={LESSON_TYPES.map((value) => ({ value, label: value }))}
            {...lessonForm.register('lessonType')}
          />
          <Input id="durationMinutes" label="Estimated Duration (minutes)" type="number" {...lessonForm.register('durationMinutes')} />
          <Button type="submit" isLoading={lessonForm.formState.isSubmitting}>
            Add Lesson
          </Button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(videoTargetLessonId)} onClose={() => setVideoTargetLessonId(null)} title="Add Video">
        <form onSubmit={videoForm.handleSubmit(onAddVideo)} className="flex flex-col gap-4">
          <Input id="videoTitle" label="Title" {...videoForm.register('title', { required: true })} />
          <Input id="videoUrl" label="Video URL" {...videoForm.register('videoUrl', { required: true })} />
          <Input id="videoThumbnailUrl" label="Thumbnail URL" {...videoForm.register('thumbnailUrl')} />
          <Input id="durationSeconds" label="Duration (seconds)" type="number" {...videoForm.register('durationSeconds')} />
          <Button type="submit" isLoading={videoForm.formState.isSubmitting}>
            Add Video
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(materialTargetLessonId)}
        onClose={() => {
          setMaterialTargetLessonId(null)
          setMaterialFile(null)
        }}
        title="Add Material"
      >
        <form onSubmit={materialForm.handleSubmit(onAddMaterial)} className="flex flex-col gap-4">
          <Input id="materialTitle" label="Title" {...materialForm.register('title', { required: true })} />
          <FileUpload
            label="File (PDF, PPT, DOC, or image)"
            accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
            onChange={setMaterialFile}
          />
          <Button type="submit" isLoading={materialForm.formState.isSubmitting}>
            Upload Material
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmTarget)}
        title="Confirm Removal"
        description="This action cannot be undone. Are you sure you want to remove this item?"
        confirmLabel="Remove"
        isDestructive
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  )
}
