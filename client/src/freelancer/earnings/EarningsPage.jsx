import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Wallet, Clock, CheckCircle2 } from 'lucide-react'
import { Table, StatCard } from '../../components/data-display'
import { Badge, Modal, Card, Button, LoadingState, ErrorState, PageHeader } from '../../components/ui'
import { Input } from '../../components/forms'
import {
  listMyCommissions,
  getMyEarningsSummary,
  getMyPaymentDetails,
  updateMyPaymentDetails,
} from '../../services/freelancerCommissionService'

const STATUS_VARIANTS = {
  POTENTIAL: 'default',
  EARNED: 'info',
  APPROVED: 'warning',
  PAYABLE: 'warning',
  PAID: 'success',
}

export default function EarningsPage() {
  const [summary, setSummary] = useState(null)
  const [commissions, setCommissions] = useState([])
  const [status, setStatus] = useState('loading')
  const [isPaymentDetailsOpen, setIsPaymentDetailsOpen] = useState(false)

  const paymentDetailsForm = useForm({
    defaultValues: {
      accountHolderName: '',
      bankAccountNumber: '',
      ifscCode: '',
      upiId: '',
      panNumber: '',
      gstNumber: '',
    },
  })

  const loadAll = async () => {
    setStatus('loading')
    try {
      const [summaryData, commissionsResponse] = await Promise.all([
        getMyEarningsSummary(),
        listMyCommissions({ page: 1, limit: 50 }),
      ])
      setSummary(summaryData)
      setCommissions(commissionsResponse.data.commissions)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  const openPaymentDetails = async () => {
    try {
      const details = await getMyPaymentDetails()
      paymentDetailsForm.reset({
        accountHolderName: details?.account_holder_name ?? '',
        bankAccountNumber: details?.bank_account_number ?? '',
        ifscCode: details?.ifsc_code ?? '',
        upiId: details?.upi_id ?? '',
        panNumber: details?.pan_number ?? '',
        gstNumber: details?.gst_number ?? '',
      })
      setIsPaymentDetailsOpen(true)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onSavePaymentDetails = async (values) => {
    try {
      await updateMyPaymentDetails(values)
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Earnings"
        description={
          <>
            Partner Level: <Badge variant="info">{summary.partnerLevel.replace(/_/g, ' ')}</Badge>
          </>
        }
        actions={
          <Button variant="secondary" onClick={openPaymentDetails}>
            Payment Details
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Commission Earned" value={`₹${summary.commissionEarned}`} icon={Wallet} accent="default" />
        <StatCard label="Commission Pending" value={`₹${summary.commissionPending}`} icon={Clock} accent="warning" />
        <StatCard label="Commission Paid" value={`₹${summary.commissionPaid}`} icon={CheckCircle2} accent="success" />
      </div>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Commission History</h3>
        <Table columns={columns} data={commissions} emptyMessage="No commissions yet." />
      </Card>

      <Modal isOpen={isPaymentDetailsOpen} onClose={() => setIsPaymentDetailsOpen(false)} title="Payment Details">
        <form onSubmit={paymentDetailsForm.handleSubmit(onSavePaymentDetails)} className="flex flex-col gap-4">
          <Input id="accountHolderName" label="Account Holder Name" {...paymentDetailsForm.register('accountHolderName')} />
          <Input id="bankAccountNumber" label="Bank Account Number" {...paymentDetailsForm.register('bankAccountNumber')} />
          <Input id="ifscCode" label="IFSC Code" {...paymentDetailsForm.register('ifscCode')} />
          <Input id="upiId" label="UPI ID" {...paymentDetailsForm.register('upiId')} />
          <Input id="panNumber" label="PAN Number" {...paymentDetailsForm.register('panNumber')} />
          <Input id="gstNumber" label="GST Number (optional)" {...paymentDetailsForm.register('gstNumber')} />
          <Button type="submit" isLoading={paymentDetailsForm.formState.isSubmitting}>
            Save Payment Details
          </Button>
        </form>
      </Modal>
    </div>
  )
}
