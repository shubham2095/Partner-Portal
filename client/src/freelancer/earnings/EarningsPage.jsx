import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Wallet, Clock, CheckCircle2, ArrowUpRight, XCircle } from 'lucide-react'
import { Table, StatCard } from '../../components/data-display'
import { Badge, Modal, Card, Button, LoadingState, ErrorState, PageHeader } from '../../components/ui'
import { Input, Select } from '../../components/forms'
import {
  listMyCommissions,
  getMyEarningsSummary,
  getMyPaymentDetails,
  updateMyPaymentDetails,
} from '../../services/freelancerCommissionService'
import {
  getMyWithdrawalSummary,
  listMyWithdrawals,
  requestWithdrawal,
} from '../../services/freelancerWithdrawalService'

const STATUS_VARIANTS = {
  POTENTIAL: 'default',
  EARNED: 'info',
  APPROVED: 'warning',
  PAYABLE: 'warning',
  PAID: 'success',
}

const WITHDRAWAL_STATUS_VARIANTS = {
  PENDING: 'info',
  APPROVED: 'warning',
  REJECTED: 'danger',
  PAID: 'success',
}

export default function EarningsPage() {
  const [summary, setSummary] = useState(null)
  const [commissions, setCommissions] = useState([])
  const [status, setStatus] = useState('loading')
  const [isPaymentDetailsOpen, setIsPaymentDetailsOpen] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [isPaymentDetailsLoading, setIsPaymentDetailsLoading] = useState(false)
  const [withdrawalSummary, setWithdrawalSummary] = useState(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)

  const withdrawForm = useForm({ defaultValues: { amount: '' } })

  const paymentDetailsForm = useForm({
    defaultValues: {
      accountHolderName: '',
      bankName: '',
      bankAccountNumber: '',
      accountType: '',
      ifscCode: '',
      upiId: '',
      panNumber: '',
      gstNumber: '',
    },
  })

  const loadAll = async () => {
    setStatus('loading')
    try {
      const [summaryData, commissionsResponse, details, withdrawalSummaryData, withdrawalsResponse] = await Promise.all([
        getMyEarningsSummary(),
        listMyCommissions({ page: 1, limit: 50 }),
        getMyPaymentDetails(),
        getMyWithdrawalSummary(),
        listMyWithdrawals({ page: 1, limit: 20 }),
      ])
      setSummary(summaryData)
      setCommissions(commissionsResponse.data.commissions)
      setPaymentDetails(details)
      setWithdrawalSummary(withdrawalSummaryData)
      setWithdrawals(withdrawalsResponse.data.withdrawals)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  const openWithdraw = () => {
    withdrawForm.reset({ amount: '' })
    setIsWithdrawOpen(true)
  }

  const onRequestWithdrawal = async (values) => {
    try {
      await requestWithdrawal(Number(values.amount))
      toast.success('Withdrawal request submitted')
      setIsWithdrawOpen(false)
      await loadAll()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const openPaymentDetails = async () => {
    setIsPaymentDetailsLoading(true)
    setIsPaymentDetailsOpen(true)
    try {
      const details = await getMyPaymentDetails()
      setPaymentDetails(details)
      // The account number is never sent back from the server (masked
      // display only) — leaving it blank means "keep the existing value";
      // the user only needs to retype it if they're actually changing it.
      paymentDetailsForm.reset({
        accountHolderName: details?.account_holder_name ?? '',
        bankName: details?.bank_name ?? '',
        bankAccountNumber: '',
        accountType: details?.account_type ?? '',
        ifscCode: details?.ifsc_code ?? '',
        upiId: details?.upi_id ?? '',
        panNumber: details?.pan_number ?? '',
        gstNumber: details?.gst_number ?? '',
      })
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsPaymentDetailsLoading(false)
    }
  }

  const onSavePaymentDetails = async (values) => {
    try {
      const payload = { ...values }
      if (!payload.bankAccountNumber) delete payload.bankAccountNumber
      const updated = await updateMyPaymentDetails(payload)
      setPaymentDetails(updated)
      toast.success('Payment details saved')
      setIsPaymentDetailsOpen(false)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  if (status === 'loading') return <LoadingState label="Loading earnings..." />
  if (status === 'error') return <ErrorState title="Unable to load your earnings" onRetry={loadAll} />

  const columns = [
    {
      key: 'lead_number',
      header: 'Lead',
      render: (row) => (
        <Link to={`/freelancer/commissions/${row.id}`} className="text-primary hover:underline">
          {row.lead_number}
        </Link>
      ),
    },
    { key: 'client_name', header: 'Client' },
    { key: 'sale_value', header: 'Sale Value', render: (row) => `₹${row.sale_value}` },
    { key: 'commission_amount', header: 'Commission', render: (row) => `₹${row.commission_amount}` },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
  ]

  const withdrawalColumns = [
    { key: 'id', header: 'Request', render: (row) => `#${row.id}` },
    { key: 'amount', header: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'created_at', header: 'Requested', render: (row) => new Date(row.created_at).toLocaleDateString() },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={WITHDRAWAL_STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
    {
      key: 'detail',
      header: 'Detail',
      render: (row) => {
        if (row.status === 'REJECTED') return <span className="text-danger">{row.rejection_reason}</span>
        if (row.status === 'PAID') return <span className="text-text-secondary">Ref: {row.transaction_reference}</span>
        return '—'
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Earnings"
        description={
          <>
            Partner Level: <Badge variant="info">{summary.partnerLevel.replace(/_/g, ' ')}</Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Commission Earned" value={`₹${summary.commissionEarned}`} icon={Wallet} accent="default" />
        <StatCard label="Commission Pending" value={`₹${summary.commissionPending}`} icon={Clock} accent="warning" />
        <StatCard label="Commission Paid" value={`₹${summary.commissionPaid}`} icon={CheckCircle2} accent="success" />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Available for Withdrawal</h3>
            <p className="mt-1 text-2xl font-bold text-text-primary">₹{withdrawalSummary.availableBalance}</p>
          </div>
          <Button onClick={openWithdraw} disabled={withdrawalSummary.availableBalance <= 0}>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} /> Withdraw
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Pending Withdrawal" value={`₹${withdrawalSummary.pendingWithdrawal}`} icon={Clock} accent="warning" />
          <StatCard label="Withdrawn (Paid)" value={`₹${withdrawalSummary.paidWithdrawal}`} icon={CheckCircle2} accent="success" />
          <StatCard label="Rejected" value={`₹${withdrawalSummary.rejectedWithdrawal}`} icon={XCircle} accent="danger" />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Withdrawal History</h3>
        <Table columns={withdrawalColumns} data={withdrawals} emptyMessage="No withdrawal requests yet." />
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">Bank Details</h3>
          <Button size="sm" variant="secondary" onClick={openPaymentDetails}>
            {paymentDetails ? 'Edit' : 'Add Bank Details'}
          </Button>
        </div>
        {paymentDetails ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-caption">Account Holder</p>
              <p className="text-text-primary">{paymentDetails.account_holder_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-caption">Bank Name</p>
              <p className="text-text-primary">{paymentDetails.bank_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-caption">Account Number</p>
              <p className="text-text-primary">{paymentDetails.bank_account_number_masked ?? '—'}</p>
            </div>
            <div>
              <p className="text-caption">Account Type</p>
              <p className="text-text-primary">{paymentDetails.account_type ?? '—'}</p>
            </div>
            <div>
              <p className="text-caption">IFSC</p>
              <p className="text-text-primary">{paymentDetails.ifsc_code ?? '—'}</p>
            </div>
            <div>
              <p className="text-caption">UPI ID</p>
              <p className="text-text-primary">{paymentDetails.upi_id ?? '—'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No bank details on file yet. Add them so commissions can be paid out.</p>
        )}
      </Card>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Commission History</h3>
        <Table columns={columns} data={commissions} emptyMessage="No commissions yet." />
      </Card>

      <Modal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} title="Request Withdrawal">
        {!paymentDetails ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-secondary">
              Add or update your bank/payment details before requesting a withdrawal.
            </p>
            <Button
              onClick={() => {
                setIsWithdrawOpen(false)
                openPaymentDetails()
              }}
            >
              Add Bank Details
            </Button>
          </div>
        ) : (
          <form onSubmit={withdrawForm.handleSubmit(onRequestWithdrawal)} className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              Available Balance: <span className="font-semibold text-text-primary">₹{withdrawalSummary.availableBalance}</span>
            </p>
            <Input
              id="amount"
              label="Withdrawal Amount"
              type="number"
              step="0.01"
              error={withdrawForm.formState.errors.amount?.message}
              {...withdrawForm.register('amount', {
                required: 'Enter an amount',
                min: { value: 0.01, message: 'Amount must be greater than zero' },
                max: { value: withdrawalSummary.availableBalance, message: 'Amount cannot exceed your available balance' },
              })}
            />
            <p className="text-xs text-text-secondary">
              The server always verifies this against your actual available balance before approving the request.
            </p>
            <Button type="submit" isLoading={withdrawForm.formState.isSubmitting}>
              Submit Request
            </Button>
          </form>
        )}
      </Modal>

      <Modal isOpen={isPaymentDetailsOpen} onClose={() => setIsPaymentDetailsOpen(false)} title="Bank Details">
        {isPaymentDetailsLoading ? (
          <LoadingState label="Loading..." />
        ) : (
          <form onSubmit={paymentDetailsForm.handleSubmit(onSavePaymentDetails)} className="flex flex-col gap-4">
            <Input
              id="accountHolderName"
              label="Account Holder Name"
              error={paymentDetailsForm.formState.errors.accountHolderName?.message}
              {...paymentDetailsForm.register('accountHolderName', {
                minLength: { value: 2, message: 'Enter the full account holder name' },
              })}
            />
            <Input id="bankName" label="Bank Name" {...paymentDetailsForm.register('bankName')} />
            <Select
              id="accountType"
              label="Account Type"
              options={[{ value: '', label: 'Select account type' }, { value: 'SAVINGS', label: 'Savings' }, { value: 'CURRENT', label: 'Current' }]}
              {...paymentDetailsForm.register('accountType')}
            />
            <Input
              id="bankAccountNumber"
              label="Bank Account Number"
              placeholder={paymentDetails?.bank_account_number_masked ?? 'Enter account number'}
              error={paymentDetailsForm.formState.errors.bankAccountNumber?.message}
              {...paymentDetailsForm.register('bankAccountNumber', {
                pattern: { value: /^[0-9]{9,18}$/, message: 'Account number must be 9-18 digits' },
              })}
            />
            {paymentDetails?.bank_account_number_masked && (
              <p className="-mt-3 text-xs text-text-secondary">Leave blank to keep the account number on file unchanged.</p>
            )}
            <Input
              id="ifscCode"
              label="IFSC Code"
              error={paymentDetailsForm.formState.errors.ifscCode?.message}
              {...paymentDetailsForm.register('ifscCode', {
                pattern: { value: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, message: 'Enter a valid IFSC code (e.g. HDFC0001234)' },
              })}
            />
            <Input
              id="upiId"
              label="UPI ID"
              error={paymentDetailsForm.formState.errors.upiId?.message}
              {...paymentDetailsForm.register('upiId', {
                pattern: { value: /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, message: 'Enter a valid UPI ID (e.g. name@bank)' },
              })}
            />
            <Input
              id="panNumber"
              label="PAN Number"
              error={paymentDetailsForm.formState.errors.panNumber?.message}
              {...paymentDetailsForm.register('panNumber', {
                pattern: { value: /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/, message: 'Enter a valid PAN (e.g. ABCDE1234F)' },
              })}
            />
            <Input id="gstNumber" label="GST Number (optional)" {...paymentDetailsForm.register('gstNumber')} />
            <Button type="submit" isLoading={paymentDetailsForm.formState.isSubmitting}>
              Save Bank Details
            </Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
