import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, Badge, Modal, Card, LoadingState, ErrorState } from '../../components/ui'
import { Textarea } from '../../components/forms'
import {
  getCertificateDetail,
  regenerateCertificatePdf,
  revokeCertificate,
  downloadCertificate,
} from '../../services/adminCertificateService'

const STATUS_VARIANTS = { ACTIVE: 'success', REVOKED: 'danger' }

export default function CertificateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [certificate, setCertificate] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isBusy, setIsBusy] = useState(false)
  const [isRevokeOpen, setIsRevokeOpen] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const data = await getCertificateDetail(id)
      setCertificate(data)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleRegenerate = async () => {
    setIsBusy(true)
    try {
      await regenerateCertificatePdf(id)
      toast.success('Certificate PDF regenerated')
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsBusy(false)
    }
  }

  const handleDownload = async () => {
    try {
      await downloadCertificate(id, `${certificate.certificate_number}.pdf`)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleRevoke = async () => {
    if (!revokeReason.trim()) {
      toast.error('A revocation reason is required')
      return
    }
    setIsBusy(true)
    try {
      await revokeCertificate(id, revokeReason)
      toast.success('Certificate revoked')
      setIsRevokeOpen(false)
      setRevokeReason('')
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsBusy(false)
    }
  }

  if (status === 'loading') return <LoadingState label="Loading certificate..." />
  if (status === 'error') return <ErrorState onRetry={loadDetail} />

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/certificates')} className="w-fit">
        ← Back to Certificates
      </Button>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{certificate.certificate_number}</h2>
            <p className="text-sm text-text-secondary">{certificate.title}</p>
          </div>
          <Badge variant={STATUS_VARIANTS[certificate.status] ?? 'default'}>{certificate.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary">
          <span>Issued: {certificate.issued_at ? new Date(certificate.issued_at).toLocaleString() : '—'}</span>
          <span>Freelancer ID: {certificate.freelancer_id}</span>
          {certificate.test_id && <span>Test ID: {certificate.test_id}</span>}
          {certificate.webinar_id && <span>Webinar ID: {certificate.webinar_id}</span>}
          {certificate.status === 'REVOKED' && (
            <>
              <span>Revoked: {certificate.revoked_at ? new Date(certificate.revoked_at).toLocaleString() : '—'}</span>
              <span>Reason: {certificate.revoke_reason ?? '—'}</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" disabled={!certificate.pdf_path} onClick={handleDownload}>
            Download PDF
          </Button>
          <Button size="sm" variant="secondary" isLoading={isBusy} onClick={handleRegenerate}>
            Regenerate PDF
          </Button>
          {certificate.status !== 'REVOKED' && (
            <Button size="sm" variant="danger" disabled={isBusy} onClick={() => setIsRevokeOpen(true)}>
              Revoke Certificate
            </Button>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isRevokeOpen}
        onClose={() => setIsRevokeOpen(false)}
        title="Revoke Certificate"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRevokeOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={isBusy} onClick={handleRevoke}>
              Revoke Certificate
            </Button>
          </>
        }
      >
        <Textarea
          id="revokeReason"
          label="Revocation Reason"
          value={revokeReason}
          onChange={(event) => setRevokeReason(event.target.value)}
        />
      </Modal>
    </div>
  )
}
