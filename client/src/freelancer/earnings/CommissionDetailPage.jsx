import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { Button, Badge, Card, LoadingState, ErrorState } from '../../components/ui'
import { cn } from '../../utils/cn'
import { getMyCommissionDetail, downloadMyContract } from '../../services/freelancerCommissionService'

const LIFECYCLE = ['POTENTIAL', 'EARNED', 'APPROVED', 'PAYABLE', 'PAID']

const STATUS_VARIANTS = {
  POTENTIAL: 'default',
  EARNED: 'info',
  APPROVED: 'warning',
  PAYABLE: 'warning',
  PAID: 'success',
}

function formatCurrency(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN')}`
}

function LifecycleStepper({ currentStatus }) {
  const currentIndex = LIFECYCLE.indexOf(currentStatus)
  return (
    <div className="flex items-center">
      {LIFECYCLE.map((stage, index) => {
        const isDone = index <= currentIndex
        const isLast = index === LIFECYCLE.length - 1
        return (
          <div key={stage} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isDone ? 'bg-primary text-white' : 'bg-surface-muted text-text-muted'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : index + 1}
              </div>
              <span className={cn('text-[11px] font-medium', isDone ? 'text-text-primary' : 'text-text-muted')}>
                {stage}
              </span>
            </div>
            {!isLast && <div className={cn('mx-1 h-0.5 flex-1', index < currentIndex ? 'bg-primary' : 'bg-border')} />}
          </div>
        )
      })}
    </div>
  )
}

export default function CommissionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [commission, setCommission] = useState(null)
  const [payment, setPayment] = useState(null)
  const [status, setStatus] = useState('loading')

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const detail = await getMyCommissionDetail(id)
      setCommission(detail.commission)
      setPayment(detail.payment)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleDownloadContract = async () => {
    try {
      const blob = await downloadMyContract(id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contract-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (status === 'loading') return <LoadingState label="Loading commission..." />
  if (status === 'error') return <ErrorState title="Unable to load this commission" onRetry={loadDetail} />

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/freelancer/commissions')} className="w-fit">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Back to Earnings
      </Button>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-text-primary sm:text-xl">
              {commission.client_name} <span className="font-normal text-text-secondary">({commission.lead_number})</span>
            </h1>
            <p className="text-sm text-text-secondary">
              Service: {commission.rule_service_name ?? commission.service_interested ?? '—'}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[commission.status] ?? 'default'}>{commission.status}</Badge>
        </div>

        <div className="flex flex-col gap-3 rounded-lg bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-caption">Commission Amount</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-text-primary">
              {formatCurrency(commission.commission_amount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-caption">Sale Value</p>
            <p className="mt-1 text-lg font-semibold text-text-secondary">{formatCurrency(commission.sale_value)}</p>
          </div>
        </div>

        <div className="py-2">
          <LifecycleStepper currentStatus={commission.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-caption">Rate</p>
            <p className="text-text-primary">
              {commission.rule_rate_type === 'PERCENTAGE' ? `${commission.rule_rate_value}%` : `₹${commission.rule_rate_value} fixed`}
            </p>
          </div>
          <div>
            <p className="text-caption">Approved At</p>
            <p className="text-text-primary">
              {commission.approved_at ? new Date(commission.approved_at).toLocaleString() : '—'}
            </p>
          </div>
        </div>

        {commission.contract_document_path && (
          <Button size="sm" variant="secondary" className="w-fit" onClick={handleDownloadContract}>
            Download Contract
          </Button>
        )}
      </Card>

      {payment && (
        <Card className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Payment Record</h3>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-caption">Amount</p>
              <p className="font-semibold text-success">{formatCurrency(payment.amount)}</p>
            </div>
            <div>
              <p className="text-caption">Payment Date</p>
              <p className="text-text-primary">{payment.payment_date}</p>
            </div>
            <div>
              <p className="text-caption">Reference</p>
              <p className="text-text-primary">{payment.transaction_reference ?? '—'}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
