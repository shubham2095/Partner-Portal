import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Table, Pagination } from '../../components/data-display'
import { Button, Badge, Modal, Card, LoadingState, ErrorState } from '../../components/ui'
import { Input, Select, Textarea } from '../../components/forms'
import {
  getWebinarDetail,
  updateWebinar,
  changeWebinarStatus,
  listWebinarRegistrations,
  markAttendance,
} from '../../services/adminWebinarService'

const WEBINAR_STATUSES = ['DRAFT', 'PUBLISHED', 'LIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED']
const ATTENDANCE_STATUSES = ['REGISTERED', 'ATTENDED', 'ABSENT']

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
  CANCELLED_REG: 'danger',
}

const LIMIT = 20

function toFormValues(webinar) {
  return {
    title: webinar.title ?? '',
    description: webinar.description ?? '',
    speakerName: webinar.speaker_name ?? '',
    speakerBio: webinar.speaker_bio ?? '',
    scheduledAt: webinar.scheduled_at ? webinar.scheduled_at.slice(0, 16) : '',
    durationMinutes: webinar.duration_minutes ?? '',
    registrationUrl: webinar.registration_url ?? '',
    meetingUrl: webinar.meeting_url ?? '',
    recordingUrl: webinar.recording_url ?? '',
    trainingMaterialUrl: webinar.training_material_url ?? '',
  }
}

export default function WebinarDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [webinar, setWebinar] = useState(null)
  const [registrationStats, setRegistrationStats] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [statusValue, setStatusValue] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const [registrations, setRegistrations] = useState([])
  const [regTotal, setRegTotal] = useState(0)
  const [regPage, setRegPage] = useState(1)

  const [attendanceTarget, setAttendanceTarget] = useState(null)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()
  const attendanceForm = useForm({ defaultValues: { attendanceStatus: 'ATTENDED', notes: '' } })

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const data = await getWebinarDetail(id)
      setWebinar(data.webinar)
      setRegistrationStats(data.registrationStats)
      setStatusValue(data.webinar.status)
      reset(toFormValues(data.webinar))
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  const loadRegistrations = async () => {
    try {
      const response = await listWebinarRegistrations(id, { page: regPage, limit: LIMIT })
      setRegistrations(response.data.registrations)
      setRegTotal(response.meta.total)
    } catch (error) {
      // handled by interceptor toast
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (status === 'ready') loadRegistrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, regPage])

  const onUpdate = async (values) => {
    try {
      await updateWebinar(id, values)
      toast.success('Webinar updated')
      setIsEditOpen(false)
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleStatusChange = async () => {
    setIsBusy(true)
    try {
      await changeWebinarStatus(id, statusValue)
      toast.success('Webinar status updated')
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsBusy(false)
    }
  }

  const onMarkAttendance = async (values) => {
    try {
      await markAttendance(id, attendanceTarget.id, values)
      toast.success('Attendance updated')
      setAttendanceTarget(null)
      await loadRegistrations()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (status === 'loading') return <LoadingState label="Loading webinar..." />
  if (status === 'error') return <ErrorState onRetry={loadDetail} />

  const columns = [
    { key: 'full_name', header: 'Freelancer' },
    { key: 'partner_id', header: 'Partner ID', render: (row) => row.partner_id ?? '—' },
    { key: 'freelancer_email', header: 'Email' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => setAttendanceTarget(row)}>
          Mark Attendance
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/webinars')} className="w-fit">
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

        <div className="flex flex-wrap gap-4 pt-2 text-sm text-text-secondary">
          <span>Registered: {registrationStats?.REGISTERED ?? 0}</span>
          <span>Attended: {registrationStats?.ATTENDED ?? 0}</span>
          <span>Absent: {registrationStats?.ABSENT ?? 0}</span>
          <span>Cancelled: {registrationStats?.CANCELLED ?? 0}</span>
          <span>Total: {registrationStats?.total ?? 0}</span>
        </div>

        <div className="flex flex-wrap items-end gap-2 pt-2">
          <Select
            id="statusValue"
            label="Change Status"
            options={WEBINAR_STATUSES.map((value) => ({ value, label: value }))}
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value)}
          />
          <Button size="sm" disabled={isBusy || statusValue === webinar.status} onClick={handleStatusChange}>
            Update Status
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsEditOpen(true)}>
            Edit Details
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Registrations</h3>
        <Table columns={columns} data={registrations} emptyMessage="No registrations yet." />
        <Pagination page={regPage} totalPages={Math.max(1, Math.ceil(regTotal / LIMIT))} onPageChange={setRegPage} />
      </Card>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Webinar">
        <form onSubmit={handleSubmit(onUpdate)} className="flex flex-col gap-4">
          <Input id="title" label="Title" {...register('title')} />
          <Textarea id="description" label="Description" {...register('description')} />
          <Input id="speakerName" label="Speaker Name" {...register('speakerName')} />
          <Textarea id="speakerBio" label="Speaker Bio" {...register('speakerBio')} />
          <Input id="scheduledAt" label="Scheduled At" type="datetime-local" {...register('scheduledAt')} />
          <Input id="durationMinutes" label="Duration (minutes)" type="number" {...register('durationMinutes')} />
          <Input id="registrationUrl" label="Registration URL" {...register('registrationUrl')} />
          <Input id="meetingUrl" label="Meeting URL" {...register('meetingUrl')} />
          <Input id="recordingUrl" label="Recording URL" {...register('recordingUrl')} />
          <Input id="trainingMaterialUrl" label="Training Material URL" {...register('trainingMaterialUrl')} />
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(attendanceTarget)}
        onClose={() => setAttendanceTarget(null)}
        title={`Mark Attendance — ${attendanceTarget?.full_name ?? ''}`}
      >
        <form onSubmit={attendanceForm.handleSubmit(onMarkAttendance)} className="flex flex-col gap-4">
          <Select
            id="attendanceStatus"
            label="Attendance Status"
            options={ATTENDANCE_STATUSES.map((value) => ({ value, label: value }))}
            {...attendanceForm.register('attendanceStatus')}
          />
          <Textarea id="notes" label="Notes" {...attendanceForm.register('notes')} />
          <Button type="submit" isLoading={attendanceForm.formState.isSubmitting}>
            Save Attendance
          </Button>
        </form>
      </Modal>
    </div>
  )
}
