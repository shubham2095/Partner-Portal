import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowLeft, CalendarClock } from 'lucide-react'
import { Button, Badge, Modal, Card, LoadingState, ErrorState } from '../../components/ui'
import { Input, Select, Textarea, FileUpload, Checkbox } from '../../components/forms'
import { LEAD_STATUSES, STATUS_VARIANTS } from '../../utils/leadConstants'

function followUpUrgency(scheduledAt) {
  const due = new Date(scheduledAt)
  const now = new Date()
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  if (due < now) return 'overdue'
  if (due < startOfTomorrow) return 'today'
  return 'upcoming'
}
import {
  getMyLeadDetail,
  changeMyLeadStatus,
  getMyLeadTimeline,
  addMyActivity,
  listFollowUpsForLead,
  createFollowUp,
  completeFollowUp,
  cancelFollowUp,
  getMyClosedDeal,
  submitClosedDeal,
} from '../../services/freelancerLeadService'

const ACTIVITY_TYPES = ['PHONE_CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'VIDEO_CALL', 'SITE_VISIT', 'NOTE_ADDED']
const FOLLOWUP_TYPES = ['PHONE_CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'VIDEO_CALL', 'SITE_VISIT', 'DEMO', 'OTHER']
const FOLLOWUP_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const TERMINAL_STATUSES = new Set(['CONVERTED', 'LOST'])

const DEAL_STATUS_VARIANTS = {
  POTENTIAL: 'info',
  EARNED: 'info',
  APPROVED: 'success',
  PAYABLE: 'success',
  PAID: 'success',
  REJECTED: 'danger',
}

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [status, setStatus] = useState('loading')
  const [statusValue, setStatusValue] = useState('')
  const [conversionValue, setConversionValue] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [isActivityOpen, setIsActivityOpen] = useState(false)
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)
  const [timeline, setTimeline] = useState({ activities: [], assignments: [] })
  const [followUps, setFollowUps] = useState([])
  const [completingFollowUp, setCompletingFollowUp] = useState(null)
  const [deal, setDeal] = useState(null)
  const [isDealOpen, setIsDealOpen] = useState(false)
  const [dealFile, setDealFile] = useState(null)

  const activityForm = useForm({ defaultValues: { activityType: 'PHONE_CALL', description: '' } })
  const followUpForm = useForm({ defaultValues: { scheduledAt: '', followUpType: 'PHONE_CALL', priority: 'MEDIUM', notes: '' } })
  const completeForm = useForm({ defaultValues: { outcome: '', nextFollowUpDate: '' } })
  const dealForm = useForm({ defaultValues: { declarationNote: '', dealClosingDate: '', termsAccepted: false } })

  const loadAll = async () => {
    setStatus('loading')
    try {
      const [leadData, timelineData, followUpsData] = await Promise.all([
        getMyLeadDetail(id),
        getMyLeadTimeline(id),
        listFollowUpsForLead(id),
      ])
      setLead(leadData)
      setStatusValue(leadData.status)
      setTimeline(timelineData)
      setFollowUps(followUpsData)
      if (leadData.status === 'CONVERTED') {
        setDeal(await getMyClosedDeal(id))
      }
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  const onSubmitDeal = async (values) => {
    try {
      const formData = new FormData()
      if (values.declarationNote) formData.append('declarationNote', values.declarationNote)
      if (values.dealClosingDate) formData.append('dealClosingDate', values.dealClosingDate)
      formData.append('termsAccepted', values.termsAccepted ? 'true' : 'false')
      if (dealFile) formData.append('document', dealFile)
      const commission = await submitClosedDeal(id, formData)
      setDeal(commission)
      toast.success('Closed deal submitted for review')
      setIsDealOpen(false)
      setDealFile(null)
      dealForm.reset()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleStatusChange = async () => {
    setIsBusy(true)
    try {
      await changeMyLeadStatus(id, statusValue, statusValue === 'CONVERTED' ? Number(conversionValue) || undefined : undefined)
      toast.success('Lead status updated')
      setConversionValue('')
      await loadAll()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsBusy(false)
    }
  }

  const onAddActivity = async (values) => {
    try {
      await addMyActivity(id, values.activityType, values.description)
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
  if (status === 'error') return <ErrorState title="Unable to load this lead" onRetry={loadAll} />

  const isClosed = TERMINAL_STATUSES.has(lead.status)
  const pendingFollowUps = followUps.filter((fu) => fu.status === 'PENDING')
  const nextFollowUp = pendingFollowUps.slice().sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0]

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/freelancer/leads')} className="w-fit">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Back to My Leads
      </Button>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-text-primary sm:text-xl">
              {lead.client_name} {lead.company && <span className="font-normal text-text-secondary">({lead.company})</span>}
            </h1>
            <p className="text-sm text-text-secondary">
              {lead.lead_number} · {lead.mobile} {lead.email && `· ${lead.email}`}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[lead.status] ?? 'default'}>{lead.status.replace(/_/g, ' ')}</Badge>
        </div>

        {nextFollowUp && (
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
              followUpUrgency(nextFollowUp.scheduled_at) === 'overdue'
                ? 'bg-danger-bg text-danger'
                : followUpUrgency(nextFollowUp.scheduled_at) === 'today'
                  ? 'bg-warning-bg text-warning'
                  : 'bg-info-bg text-info'
            }`}
          >
            <CalendarClock className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="font-medium">
              Next action: {nextFollowUp.follow_up_type.replace(/_/g, ' ')} —{' '}
              {new Date(nextFollowUp.scheduled_at).toLocaleString()}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary sm:grid-cols-4">
          <span>Location: {lead.location ?? '—'}</span>
          <span>Category: {lead.business_category ?? '—'}</span>
          <span>Service: {lead.service_interested ?? '—'}</span>
          <span>Source: {lead.source ?? '—'}</span>
          <span>Expected: {lead.expected_value ? `₹${lead.expected_value}` : '—'}</span>
          <span>Conversion: {lead.conversion_value ? `₹${lead.conversion_value}` : '—'}</span>
        </div>
        {lead.notes && <p className="text-sm text-text-secondary">Notes: {lead.notes}</p>}

        {isClosed ? (
          <p className="text-sm text-text-secondary">This lead is closed ({lead.status.replace(/_/g, ' ')}).</p>
        ) : (
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
            <Button size="sm" variant="secondary" onClick={() => setIsActivityOpen(true)}>
              Log Activity
            </Button>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">Follow-ups</h3>
          {!isClosed && (
            <Button size="sm" onClick={() => setIsFollowUpOpen(true)}>
              Add Follow-up
            </Button>
          )}
        </div>
        {followUps.length === 0 && <p className="text-sm text-text-secondary">No follow-ups yet.</p>}
        {followUps.map((fu) => {
          const urgency = fu.status === 'PENDING' ? followUpUrgency(fu.scheduled_at) : null
          return (
          <div
            key={fu.id}
            className={`flex items-center justify-between rounded-md border p-3 text-sm ${
              urgency === 'overdue' ? 'border-danger/30 bg-danger-bg' : 'border-border'
            }`}
          >
            <div>
              <p className="font-medium text-text-primary">
                {fu.follow_up_type.replace(/_/g, ' ')} — {new Date(fu.scheduled_at).toLocaleString()}
                {urgency === 'overdue' && <span className="ml-2 text-xs font-semibold text-danger">OVERDUE</span>}
                {urgency === 'today' && <span className="ml-2 text-xs font-semibold text-warning">TODAY</span>}
              </p>
              {fu.notes && <p className="text-text-secondary">{fu.notes}</p>}
              {fu.outcome && <p className="text-text-secondary">Outcome: {fu.outcome}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={fu.status === 'COMPLETED' ? 'success' : fu.status === 'CANCELLED' ? 'danger' : 'info'}>
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
          )
        })}
      </Card>

      {lead.status === 'CONVERTED' && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Closed Deal / Commission Contract</h3>
            {deal && <Badge variant={DEAL_STATUS_VARIANTS[deal.status] ?? 'default'}>{deal.status}</Badge>}
          </div>

          {!deal && (
            <>
              <p className="text-sm text-text-secondary">
                This lead is converted. Submit the closed deal so it can be reviewed and turned into a payable commission.
              </p>
              <Button size="sm" className="w-fit" onClick={() => setIsDealOpen(true)}>
                Submit Closed Deal
              </Button>
            </>
          )}

          {deal && deal.status === 'REJECTED' && (
            <>
              <p className="text-sm text-danger">Rejected: {deal.rejection_reason}</p>
              <Button size="sm" className="w-fit" onClick={() => setIsDealOpen(true)}>
                Resubmit Closed Deal
              </Button>
            </>
          )}

          {deal && ['POTENTIAL', 'EARNED'].includes(deal.status) && (
            <p className="text-sm text-text-secondary">
              Submitted for ₹{deal.commission_amount} commission — pending admin review.
            </p>
          )}

          {deal && ['APPROVED', 'PAYABLE', 'PAID'].includes(deal.status) && (
            <p className="text-sm text-text-secondary">
              Approved — commission of ₹{deal.commission_amount} is now {deal.status.toLowerCase()}.{' '}
              <Link to={`/freelancer/commissions/${deal.id}`} className="text-primary hover:underline">
                View commission
              </Link>
            </p>
          )}
        </Card>
      )}

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
          </div>
        ))}
      </Card>

      <Modal isOpen={isDealOpen} onClose={() => setIsDealOpen(false)} title="Submit Closed Deal">
        <form onSubmit={dealForm.handleSubmit(onSubmitDeal)} className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Conversion value: {lead.conversion_value ? `₹${lead.conversion_value}` : '—'}. Commission is calculated by the
            admin's configured commission rule once submitted.
          </p>
          <Input id="dealClosingDate" label="Deal Closing Date" type="date" {...dealForm.register('dealClosingDate')} />
          <Textarea
            id="declarationNote"
            label="Declaration / Notes (optional)"
            {...dealForm.register('declarationNote')}
          />
          <FileUpload label="Supporting Document (optional)" accept=".pdf,image/*,.doc,.docx" onChange={setDealFile} />
          <div>
            <Checkbox
              id="termsAccepted"
              label="I confirm this deal is genuine and accept the commission contract terms & conditions."
              {...dealForm.register('termsAccepted', { required: 'You must accept the terms & conditions' })}
            />
            {dealForm.formState.errors.termsAccepted && (
              <p className="mt-1 text-xs text-danger">{dealForm.formState.errors.termsAccepted.message}</p>
            )}
          </div>
          <Button type="submit" isLoading={dealForm.formState.isSubmitting}>
            Submit for Review
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
          <Select
            id="priority"
            label="Priority"
            options={FOLLOWUP_PRIORITIES.map((value) => ({ value, label: value }))}
            {...followUpForm.register('priority')}
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
