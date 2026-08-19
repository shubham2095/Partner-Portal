import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Badge, Card, LoadingState, ErrorState } from '../../components/ui'
import { getMyCertificateDetail, downloadMyCertificate } from '../../services/freelancerCertificateService'

const STATUS_VARIANTS = { ACTIVE: 'success', REVOKED: 'danger' }

export default function CertificateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [certificate, setCertificate] = useState(null)
  const [status, setStatus] = useState('loading')

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const data = await getMyCertificateDetail(id)
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

  const handleDownload = async () => {
    try {
      await downloadMyCertificate(id, `${certificate.certificate_number}.pdf`)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (status === 'loading') return <LoadingState label="Loading certificate..." />
  if (status === 'error') return <ErrorState onRetry={loadDetail} />

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/freelancer/certificates')} className="w-fit">
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
          {certificate.status === 'REVOKED' && <span>Revoked: {certificate.revoked_at ? new Date(certificate.revoked_at).toLocaleString() : '—'}</span>}
        </div>

        <div className="pt-2">
          <Button size="sm" disabled={!certificate.pdf_path || certificate.status === 'REVOKED'} onClick={handleDownload}>
            Download PDF
          </Button>
        </div>
      </Card>
    </div>
  )
}
