import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Textarea from '../../components/forms/Textarea'
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
} from '../../services/adminFreelancerService'

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

export default function FreelancerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const data = await getFreelancerDetail(id)
      setDetail(data)
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

  if (status === 'loading') return <LoadingState label="Loading freelancer..." />
  if (status === 'error') return <ErrorState onRetry={loadDetail} />

  const { profile, documents } = detail

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/freelancers')} className="w-fit">
        ← Back to Freelancers
      </Button>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{profile.full_name}</h2>
            <p className="text-sm text-text-secondary">
              {profile.email} · Partner ID: {profile.partner_id ?? 'Pending'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANTS[profile.status] ?? 'default'}>{profile.status}</Badge>
            <Badge variant={profile.is_active ? 'success' : 'danger'}>
              {profile.is_active ? 'Account Active' : 'Account Suspended'}
            </Badge>
          </div>
        </div>

        {profile.status === 'REJECTED' && profile.rejection_reason && (
          <p className="text-sm text-danger">Rejection reason: {profile.rejection_reason}</p>
        )}

        <div className="grid grid-cols-1 gap-2 text-sm text-text-secondary sm:grid-cols-2">
          <p>Mobile: {profile.mobile}</p>
          <p>Location: {profile.location ?? '—'}</p>
          <p>Current Occupation: {profile.current_occupation ?? '—'}</p>
          <p>Total Experience: {profile.total_experience_years ?? '—'} years</p>
          <p>Skills: {profile.skills ?? '—'}</p>
          <p>Specializations: {profile.specializations ?? '—'}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
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
      </Card>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Documents</h3>
        {documents.length === 0 ? (
          <EmptyState title="No documents submitted yet" />
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
