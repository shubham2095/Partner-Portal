import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, ShieldCheck, FileText, TrendingUp, MapPin, Briefcase } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Avatar from '../../components/ui/Avatar'
import Textarea from '../../components/forms/Textarea'
import Select from '../../components/forms/Select'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import {
  getFreelancerDetail,
  verifyFreelancerProfile,
  rejectFreelancerProfile,
  activateFreelancerAccount,
  suspendFreelancerAccount,
  verifyFreelancerDocument,
  rejectFreelancerDocument,
  downloadFreelancerDocument,
} from '../../services/adminFreelancerService'
import { changePartnerLevel } from '../../services/adminCommissionService'

const PARTNER_LEVELS = ['STARTER', 'CERTIFIED_PARTNER', 'PREMIUM_PARTNER', 'ELITE_PARTNER']

const STATUS_VARIANTS = {
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
  QUALIFIED: 'info',
  CERTIFIED: 'success',
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  INACTIVE: 'default',
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-caption">{label}</span>
      <span className="text-sm text-text-primary">{value ?? '—'}</span>
    </div>
  )
}

export default function FreelancerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [levelValue, setLevelValue] = useState('')

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const data = await getFreelancerDetail(id)
      setDetail(data)
      setLevelValue(data.profile.partner_level ?? 'STARTER')
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const runAction = async (action, successMessage) => {
    setIsBusy(true)
    try {
      await action()
      toast.success(successMessage)
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsBusy(false)
    }
  }

  const handleVerify = () => runAction(() => verifyFreelancerProfile(id), 'Profile verified')

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('A rejection reason is required')
      return
    }
    await runAction(() => rejectFreelancerProfile(id, rejectReason), 'Profile rejected')
    setIsRejectModalOpen(false)
    setRejectReason('')
  }

  const handleActivate = () => runAction(() => activateFreelancerAccount(id), 'Account activated')

  const handleSuspend = async () => {
    await runAction(() => suspendFreelancerAccount(id), 'Account suspended')
    setIsSuspendDialogOpen(false)
  }

  const handleVerifyDocument = (documentId) =>
    runAction(() => verifyFreelancerDocument(documentId), 'Document verified')

  const handleRejectDocument = (documentId) =>
    runAction(() => rejectFreelancerDocument(documentId), 'Document rejected')

  const handleViewDocument = async (documentId, filename) => {
    try {
      const blob = await downloadFreelancerDocument(documentId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename ?? `document-${documentId}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleChangeLevel = () => runAction(() => changePartnerLevel(id, levelValue), 'Partner level updated')

  if (status === 'loading') return <LoadingState label="Loading freelancer..." />
  if (status === 'error') return <ErrorState title="Unable to load this freelancer" onRetry={loadDetail} />

  const { profile, documents } = detail
  const pendingDocs = documents.filter((d) => d.status === 'PENDING').length

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/freelancers')} className="w-fit">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Back to Freelancers
      </Button>

      {/* Header: identity, status, primary actions */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={profile.full_name} size={56} />
            <div>
              <h1 className="text-lg font-bold text-text-primary sm:text-xl">{profile.full_name}</h1>
              <p className="text-sm text-text-secondary">
                {profile.email} · Partner ID: {profile.partner_id ?? 'Pending'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANTS[profile.status] ?? 'default'}>{profile.status}</Badge>
                <Badge variant={profile.is_active ? 'success' : 'danger'}>
                  {profile.is_active ? 'Account Active' : 'Account Suspended'}
                </Badge>
                {profile.partner_level && <Badge variant="info">{profile.partner_level.replace(/_/g, ' ')}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={isBusy || profile.status === 'VERIFIED'} onClick={handleVerify}>
              Verify Profile
            </Button>
            <Button size="sm" variant="danger" disabled={isBusy} onClick={() => setIsRejectModalOpen(true)}>
              Reject Profile
            </Button>
            {profile.is_active ? (
              <Button size="sm" variant="danger" disabled={isBusy} onClick={() => setIsSuspendDialogOpen(true)}>
                Suspend Account
              </Button>
            ) : (
              <Button size="sm" disabled={isBusy} onClick={handleActivate}>
                Activate Account
              </Button>
            )}
          </div>
        </div>

        {profile.status === 'REJECTED' && profile.rejection_reason && (
          <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            Rejection reason: {profile.rejection_reason}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <MapPin className="h-4 w-4 text-primary" strokeWidth={2} /> Personal Information
          </h3>
          <div className="divide-y divide-border">
            <InfoRow label="Mobile" value={profile.mobile} />
            <InfoRow label="Location" value={profile.location} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Briefcase className="h-4 w-4 text-primary" strokeWidth={2} /> Professional Details
          </h3>
          <div className="divide-y divide-border">
            <InfoRow label="Current Occupation" value={profile.current_occupation} />
            <InfoRow
              label="Total Experience"
              value={profile.total_experience_years ? `${profile.total_experience_years} years` : null}
            />
            <InfoRow label="Skills" value={profile.skills} />
            <InfoRow label="Specializations" value={profile.specializations} />
          </div>
        </Card>
      </div>

      <Card className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <TrendingUp className="h-4 w-4 text-primary" strokeWidth={2} /> Partner Level
          </h3>
          <p className="text-xs text-text-muted">Controls training access, lead priority and support level.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Select
            id="partnerLevel"
            options={PARTNER_LEVELS.map((value) => ({ value, label: value.replace(/_/g, ' ') }))}
            value={levelValue}
            onChange={(event) => setLevelValue(event.target.value)}
          />
          <Button size="sm" variant="secondary" disabled={isBusy || levelValue === profile.partner_level} onClick={handleChangeLevel}>
            Update Level
          </Button>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <FileText className="h-4 w-4 text-primary" strokeWidth={2} /> Documents
          </h3>
          {pendingDocs > 0 && <Badge variant="warning">{pendingDocs} pending review</Badge>}
        </div>
        {documents.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No documents submitted yet"
            description="Verification documents uploaded by this freelancer will appear here."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{document.document_type}</p>
                  <p className="text-xs text-text-secondary">{document.original_filename}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANTS[document.status] ?? 'default'}>{document.status}</Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleViewDocument(document.id, document.original_filename)}
                  >
                    View
                  </Button>
                  {document.status !== 'VERIFIED' && (
                    <Button size="sm" disabled={isBusy} onClick={() => handleVerifyDocument(document.id)}>
                      Verify
                    </Button>
                  )}
                  {document.status !== 'REJECTED' && (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isBusy}
                      onClick={() => handleRejectDocument(document.id)}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Freelancer Profile"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={isBusy} onClick={handleReject}>
              Reject Profile
            </Button>
          </>
        }
      >
        <Textarea
          id="rejectReason"
          label="Reason for rejection"
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isSuspendDialogOpen}
        onClose={() => setIsSuspendDialogOpen(false)}
        onConfirm={handleSuspend}
        title="Suspend this account?"
        description="The freelancer will be immediately unable to log in until reactivated."
        confirmLabel="Suspend"
        isDestructive
      />
    </div>
  )
}
