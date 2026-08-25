import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { Button, Badge, Modal, Card, LoadingState, ErrorState } from '../../components/ui'
import { Input, Textarea, FileUpload } from '../../components/forms'
import {
  getWithdrawalDetail,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
} from '../../services/adminWithdrawalService'

const STATUS_VARIANTS = { PENDING: 'info', APPROVED: 'warning', REJECTED: 'danger', PAID: 'success' }

function formatCurrency(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN')}`
}

export default function WithdrawalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isBusy, setIsBusy] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isPaidOpen, setIsPaidOpen] = useState(false)
  const [proofFile, setProofFile] = useState(null)

  const rejectForm = useForm({ defaultValues: { reason: '' } })
  const paidForm = useForm({ defaultValues: { transactionReference: '', paidDate: '', adminNote: '' } })

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const data = await getWithdrawalDetail(id)
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

  const handleApprove = async () => {
    setIsBusy(true)
    try {
      await approveWithdrawal(id)
      toast.success('Withdrawal approved')
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsBusy(false)
    }
  }

  const onReject = async (values) => {
    try {
      await rejectWithdrawal(id, values.reason)
      toast.success('Withdrawal rejected')
      setIsRejectOpen(false)
      rejectForm.reset()
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onMarkPaid = async (values) => {
    try {
      const formData = new FormData()
      formData.append('transactionReference', values.transactionReference)
      formData.append('paidDate', values.paidDate)
      if (values.adminNote) formData.append('adminNote', values.adminNote)
      if (proofFile) formData.append('proof', proofFile)
      await markWithdrawalPaid(id, formData)
      toast.success('Withdrawal marked as paid')
      setIsPaidOpen(false)
      setProofFile(null)
      paidForm.reset()
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (status === 'loading') return <LoadingState label="Loading withdrawal..." />
  if (status === 'error') return <ErrorState title="Unable to load this withdrawal" onRetry={loadDetail} />

  const { withdrawal, commissions, bankDetails } = detail

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/withdrawals')} className="w-fit">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Back to Withdrawals
      </Button>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-text-primary sm:text-xl">
              Withdrawal #{withdrawal.id} — {withdrawal.freelancer_name}
            </h1>
            <p className="text-sm text-text-secondary">Partner ID: {withdrawal.partner_id ?? '—'}</p>
          </div>
          <Badge variant={STATUS_VARIANTS[withdrawal.status] ?? 'default'}>{withdrawal.status}</Badge>
        </div>

        <div className="rounded-lg bg-surface-muted p-4">
          <p className="text-caption">Requested Amount</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-text-primary">{formatCurrency(withdrawal.amount)}</p>
        </div>

        {withdrawal.status === 'REJECTED' && (
          <div className="rounded-lg bg-danger-bg p-4 text-sm text-danger">
            <p className="font-semibold">Rejected</p>
            <p>{withdrawal.rejection_reason}</p>
          </div>
        )}

        {withdrawal.status === 'PAID' && (
          <div className="rounded-lg bg-success-bg p-4 text-sm text-success">
            <p className="font-semibold">Paid</p>
            <p>Reference: {withdrawal.transaction_reference}</p>
            <p>Paid at: {withdrawal.paid_at ? new Date(withdrawal.paid_at).toLocaleString() : '—'}</p>
            {withdrawal.admin_note && <p>Note: {withdrawal.admin_note}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-caption">Requested At</p>
            <p className="text-text-primary">{new Date(withdrawal.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-caption">Reviewed By</p>
            <p className="text-text-primary">{withdrawal.reviewed_by_email ?? '—'}</p>
          </div>
          <div>
            <p className="text-caption">Reviewed At</p>
            <p className="text-text-primary">{withdrawal.reviewed_at ? new Date(withdrawal.reviewed_at).toLocaleString() : '—'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {withdrawal.status === 'PENDING' && (
            <>
              <Button size="sm" isLoading={isBusy} onClick={handleApprove}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => setIsRejectOpen(true)}>
                Reject
              </Button>
            </>
          )}
          {withdrawal.status === 'APPROVED' && (
            <Button size="sm" onClick={() => setIsPaidOpen(true)}>
              Mark as Paid
            </Button>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-text-primary">Bank Details</h3>
        {bankDetails ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-caption">Account Holder</p>
              <p className="text-text-primary">{bankDetails.account_holder_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-caption">Account Number</p>
              <p className="text-text-primary">{bankDetails.bank_account_number_masked ?? '—'}</p>
            </div>
            <div>
              <p className="text-caption">IFSC</p>
              <p className="text-text-primary">{bankDetails.ifsc_code ?? '—'}</p>
            </div>
            <div>
              <p className="text-caption">UPI ID</p>
              <p className="text-text-primary">{bankDetails.upi_id ?? '—'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No bank details on file for this freelancer.</p>
        )}
      </Card>

      <Card className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-text-primary">Reserved Commissions</h3>
        {commissions.length === 0 && <p className="text-sm text-text-secondary">No commissions linked.</p>}
        {commissions.map((c) => (
          <div key={c.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
            <Link to={`/admin/commissions/${c.id}`} className="text-primary hover:underline">
              {c.lead_number} — {c.client_name}
            </Link>
            <span className="font-medium text-text-primary">{formatCurrency(c.commission_amount)}</span>
          </div>
        ))}
      </Card>

      <Modal isOpen={isRejectOpen} onClose={() => setIsRejectOpen(false)} title="Reject Withdrawal">
        <form onSubmit={rejectForm.handleSubmit(onReject)} className="flex flex-col gap-4">
          <Textarea
            id="reason"
            label="Rejection Reason"
            error={rejectForm.formState.errors.reason?.message}
            {...rejectForm.register('reason', { required: 'A rejection reason is required' })}
          />
          <Button type="submit" variant="danger" isLoading={rejectForm.formState.isSubmitting}>
            Reject
          </Button>
        </form>
      </Modal>

      <Modal isOpen={isPaidOpen} onClose={() => setIsPaidOpen(false)} title="Mark as Paid">
        <form onSubmit={paidForm.handleSubmit(onMarkPaid)} className="flex flex-col gap-4">
          <p className="text-xs text-text-secondary">
            This records that you manually transferred the funds outside the app. No payment is sent automatically.
          </p>
          <Input
            id="transactionReference"
            label="Transaction Reference"
            error={paidForm.formState.errors.transactionReference?.message}
            {...paidForm.register('transactionReference', { required: 'A transaction reference is required' })}
          />
          <Input
            id="paidDate"
            label="Paid Date"
            type="date"
            error={paidForm.formState.errors.paidDate?.message}
            {...paidForm.register('paidDate', { required: 'A paid date is required' })}
          />
          <Textarea id="adminNote" label="Admin Note (optional)" {...paidForm.register('adminNote')} />
          <FileUpload label="Payment Proof (optional)" accept=".pdf,image/*" onChange={setProofFile} />
          <Button type="submit" isLoading={paidForm.formState.isSubmitting}>
            Confirm Paid
          </Button>
        </form>
      </Modal>
    </div>
  )
}
