import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Button, Badge, Modal, Card, LoadingState, ErrorState } from '../../components/ui'
import { Input, Select, Textarea } from '../../components/forms'
import { LEAD_STATUSES, STATUS_VARIANTS } from '../../utils/leadConstants'
import {
  getLeadDetail,
  updateLead,
  changeLeadStatus,
  assignLead,
  getLeadTimeline,
  addActivity,
  listFollowUpsForLead,
  createFollowUp,
  completeFollowUp,
  cancelFollowUp,
} from '../../services/adminLeadService'
import { listFreelancers } from '../../services/adminFreelancerService'

const ACTIVITY_TYPES = ['PHONE_CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'VIDEO_CALL', 'SITE_VISIT', 'NOTE_ADDED']
const FOLLOWUP_TYPES = ['PHONE_CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'VIDEO_CALL', 'SITE_VISIT']

function toFormValues(lead) {
  return {
    clientName: lead.client_name ?? '',
    company: lead.company ?? '',
    mobile: lead.mobile ?? '',
    email: lead.email ?? '',
    location: lead.location ?? '',
    businessCategory: lead.business_category ?? '',
    serviceInterested: lead.service_interested ?? '',
    source: lead.source ?? '',
    expectedValue: lead.expected_value ?? '',
    notes: lead.notes ?? '',
  }
}

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [status, setStatus] = useState('loading')
  const [statusValue, setStatusValue] = useState('')
  const [conversionValue, setConversionValue] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [isActivityOpen, setIsActivityOpen] = useState(false)
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)
  const [freelancers, setFreelancers] = useState([])
  const [timeline, setTimeline] = useState({ activities: [], assignments: [] })
  const [followUps, setFollowUps] = useState([])

  const editForm = useForm()
  const assignForm = useForm({ defaultValues: { freelancerId: '', note: '' } })
  const activityForm = useForm({ defaultValues: { activityType: 'PHONE_CALL', description: '' } })
  const followUpForm = useForm({ defaultValues: { scheduledAt: '', followUpType: 'PHONE_CALL', notes: '' } })
  const completeForm = useForm({ defaultValues: { outcome: '', nextFollowUpDate: '' } })
  const [completingFollowUp, setCompletingFollowUp] = useState(null)

  const loadAll = async () => {
    setStatus('loading')
    try {
      const [leadData, timelineData, followUpsData] = await Promise.all([
        getLeadDetail(id),
        getLeadTimeline(id),
        listFollowUpsForLead(id),
      ])
      setLead(leadData)
      setStatusValue(leadData.status)
      editForm.reset(toFormValues(leadData))
      setTimeline(timelineData)
      setFollowUps(followUpsData)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  const loadFreelancers = async () => {
    try {
      const response = await listFreelancers({ page: 1, limit: 100 })
      setFreelancers(response.data.freelancers)
    } catch (error) {
      // handled by interceptor toast
    }
  }

  useEffect(() => {
    loadAll()
    loadFreelancers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onUpdate = async (values) => {
    try {
      await updateLead(id, values)
      toast.success('Lead updated')
      setIsEditOpen(false)
      await loadAll()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleStatusChange = async () => {
    setIsBusy(true)
    try {
      await changeLeadStatus(id, statusValue, statusValue === 'CONVERTED' ? Number(conversionValue) || undefined : undefined)
      toast.success('Lead status updated')
      setConversionValue('')
      await loadAll()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsBusy(false)
    }
  }

  const onAssign = async (values) => {
    try {
      await assignLead(id, values.freelancerId ? Number(values.freelancerId) : null, values.note)
      toast.success('Lead assignment updated')
      setIsAssignOpen(false)
      assignForm.reset()
      await loadAll()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onAddActivity = async (values) => {
    try {
      await addActivity(id, values.activityType, values.description)
      toast.success('Activity recorded')
      setIsActivityOpen(false)
      activityForm.reset()
      await loadAll()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onCreateFollowUp = async (values) => {
    try {
      await createFollowUp(id, values)
      toast.success('Follow-up created')
      setIsFollowUpOpen(false)
      followUpForm.reset()
      await loadAll()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onCompleteFollowUp = async (values) => {
    try {
      await completeFollowUp(completingFollowUp.id, values.outcome, values.nextFollowUpDate || undefined)
      toast.success('Follow-up completed')
      setCompletingFollowUp(null)
      completeForm.reset()
      await loadAll()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleCancelFollowUp = async (followUpId) => {
    try {
      await cancelFollowUp(followUpId)
      toast.success('Follow-up cancelled')
      await loadAll()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (status === 'loading') return <LoadingState label="Loading lead..." />
  if (status === 'error') return <ErrorState onRetry={loadAll} />

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/leads')} className="w-fit">
        ← Back to Leads
      </Button>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {lead.client_name} {lead.company && <span className="text-text-secondary">({lead.company})</span>}
            </h2>
            <p className="text-sm text-text-secondary">
              {lead.lead_number} · {lead.mobile} {lead.email && `· ${lead.email}`}
            </p>
            <p className="text-xs text-text-secondary">
              Assigned to: {lead.assigned_freelancer_name ?? 'Unassigned'} {lead.assigned_partner_id && `(${lead.assigned_partner_id})`}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[lead.status] ?? 'default'}>{lead.status.replace(/_/g, ' ')}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary sm:grid-cols-4">
          <span>Location: {lead.location ?? '—'}</span>
          <span>Category: {lead.business_category ?? '—'}</span>
          <span>Service: {lead.service_interested ?? '—'}</span>
          <span>Source: {lead.source ?? '—'}</span>
          <span>Expected: {lead.expected_value ? `₹${lead.expected_value}` : '—'}</span>
          <span>Conversion: {lead.conversion_value ? `₹${lead.conversion_value}` : '—'}</span>
          <span>Next Follow-up: {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleString() : '—'}</span>
        </div>
        {lead.notes && <p className="text-sm text-text-secondary">Notes: {lead.notes}</p>}

        <div className="flex flex-wrap items-end gap-2 pt-2">
          <Select
            id="statusValue"
            label="Change Status"
            options={LEAD_STATUSES.map((value) => ({ value, label: value.replace(/_/g, ' ') }))}
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value)}
          />
          {statusValue === 'CONVERTED' && (
            <Input
              id="conversionValue"
              label="Conversion Value"
              type="number"
              value={conversionValue}
              onChange={(event) => setConversionValue(event.target.value)}
            />
          )}
          <Button size="sm" disabled={isBusy || statusValue === lead.status} onClick={handleStatusChange}>
            Update Status
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsEditOpen(true)}>
            Edit Details
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsAssignOpen(true)}>
            Assign / Reassign
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsActivityOpen(true)}>
            Log Activity
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">Follow-ups</h3>
          <Button size="sm" onClick={() => setIsFollowUpOpen(true)}>
            Add Follow-up
          </Button>
        </div>
        {followUps.length === 0 && <p className="text-sm text-text-secondary">No follow-ups yet.</p>}
        {followUps.map((fu) => (
          <div key={fu.id} className="flex items-center justify-between rounded border border-border p-3 text-sm">
            <div>
              <p className="font-medium text-text-primary">
                {fu.follow_up_type.replace(/_/g, ' ')} — {new Date(fu.scheduled_at).toLocaleString()}
              </p>
              {fu.notes && <p className="text-text-secondary">{fu.notes}</p>}
              {fu.outcome && <p className="text-text-secondary">Outcome: {fu.outcome}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={fu.status === 'COMPLETED' ? 'success' : fu.status === 'CANCELLED' ? 'danger' : 'info'}
              >
                {fu.status}
              </Badge>
              {fu.status === 'PENDING' && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => setCompletingFollowUp(fu)}>
                    Complete
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCancelFollowUp(fu.id)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-text-primary">Timeline</h3>
        {timeline.activities.length === 0 && <p className="text-sm text-text-secondary">No activity yet.</p>}
        {timeline.activities.map((activity) => (
          <div key={activity.id} className="border-b border-border pb-2 text-sm last:border-0">
            <div className="flex items-center justify-between">
              <Badge variant="default">{activity.activity_type.replace(/_/g, ' ')}</Badge>
              <span className="text-xs text-text-secondary">{new Date(activity.created_at).toLocaleString()}</span>
            </div>
            {activity.description && <p className="mt-1 text-text-secondary">{activity.description}</p>}
            <p className="text-xs text-text-secondary">by {activity.actor_email ?? 'system'}</p>
          </div>
        ))}
      </Card>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Lead">
        <form onSubmit={editForm.handleSubmit(onUpdate)} className="flex flex-col gap-4">
          <Input id="clientName" label="Client Name" {...editForm.register('clientName')} />
          <Input id="company" label="Company" {...editForm.register('company')} />
          <Input id="mobile" label="Mobile" {...editForm.register('mobile')} />
          <Input id="email" label="Email" {...editForm.register('email')} />
          <Input id="location" label="Location" {...editForm.register('location')} />
          <Input id="businessCategory" label="Business Category" {...editForm.register('businessCategory')} />
          <Input id="serviceInterested" label="Service Interested" {...editForm.register('serviceInterested')} />
          <Input id="source" label="Source" {...editForm.register('source')} />
          <Input id="expectedValue" label="Expected Value" type="number" {...editForm.register('expectedValue')} />
          <Textarea id="notes" label="Notes" {...editForm.register('notes')} />
          <Button type="submit" isLoading={editForm.formState.isSubmitting}>
            Save Changes
          </Button>
        </form>
      </Modal>

      <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign / Reassign Lead">
        <form onSubmit={assignForm.handleSubmit(onAssign)} className="flex flex-col gap-4">
          <Select
            id="freelancerId"
            label="Freelancer"
            options={[{ value: '', label: 'Unassign' }, ...freelancers.map((f) => ({ value: String(f.id), label: `${f.full_name} (${f.partner_id ?? 'no partner id'})` }))]}
            {...assignForm.register('freelancerId')}
          />
          <Input id="assignNote" label="Note" {...assignForm.register('note')} />
          <Button type="submit" isLoading={assignForm.formState.isSubmitting}>
            Save Assignment
          </Button>
        </form>
      </Modal>

      <Modal isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} title="Log Activity">
        <form onSubmit={activityForm.handleSubmit(onAddActivity)} className="flex flex-col gap-4">
          <Select
            id="activityType"
            label="Type"
            options={ACTIVITY_TYPES.map((value) => ({ value, label: value.replace(/_/g, ' ') }))}
            {...activityForm.register('activityType')}
          />
          <Textarea id="activityDescription" label="Description" {...activityForm.register('description')} />
          <Button type="submit" isLoading={activityForm.formState.isSubmitting}>
            Save Activity
          </Button>
        </form>
      </Modal>

      <Modal isOpen={isFollowUpOpen} onClose={() => setIsFollowUpOpen(false)} title="Add Follow-up">
        <form onSubmit={followUpForm.handleSubmit(onCreateFollowUp)} className="flex flex-col gap-4">
          <Input id="scheduledAt" label="Scheduled At" type="datetime-local" {...followUpForm.register('scheduledAt', { required: true })} />
          <Select
            id="followUpType"
            label="Type"
            options={FOLLOWUP_TYPES.map((value) => ({ value, label: value.replace(/_/g, ' ') }))}
            {...followUpForm.register('followUpType')}
          />
          <Textarea id="followUpNotes" label="Notes" {...followUpForm.register('notes')} />
          <Button type="submit" isLoading={followUpForm.formState.isSubmitting}>
            Add Follow-up
          </Button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(completingFollowUp)} onClose={() => setCompletingFollowUp(null)} title="Complete Follow-up">
        <form onSubmit={completeForm.handleSubmit(onCompleteFollowUp)} className="flex flex-col gap-4">
          <Textarea id="outcome" label="Outcome" {...completeForm.register('outcome')} />
          <Input id="nextFollowUpDate" label="Next Follow-up Date (optional)" type="datetime-local" {...completeForm.register('nextFollowUpDate')} />
          <Button type="submit" isLoading={completeForm.formState.isSubmitting}>
            Mark Complete
          </Button>
        </form>
      </Modal>
    </div>
  )
}
