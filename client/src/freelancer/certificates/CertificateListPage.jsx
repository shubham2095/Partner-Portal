import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table } from '../../components/data-display'
import { Badge, ErrorState } from '../../components/ui'
import { listMyCertificates } from '../../services/freelancerCertificateService'

const STATUS_VARIANTS = { ACTIVE: 'success', REVOKED: 'danger' }

export default function CertificateListPage() {
  const [certificates, setCertificates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadCertificates = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const data = await listMyCertificates()
      setCertificates(data)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCertificates()
  }, [])

  if (hasError) return <ErrorState onRetry={loadCertificates} />

  const columns = [
    {
      key: 'certificate_number',
      header: 'Certificate #',
      render: (row) => (
        <Link to={`/freelancer/certificates/${row.id}`} className="text-sm text-primary hover:underline">
          {row.certificate_number}
        </Link>
      ),
    },
    { key: 'title', header: 'Title' },
    { key: 'test_title', header: 'Test', render: (row) => row.test_title ?? '—' },
    {
      key: 'issued_at',
      header: 'Issued',
      render: (row) => (row.issued_at ? new Date(row.issued_at).toLocaleDateString() : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">My Certificates</h2>
        <p className="text-sm text-text-secondary">Certificates you've earned by passing qualification tests.</p>
      </div>
      <Table columns={columns} data={certificates} isLoading={isLoading} emptyMessage="You haven't earned any certificates yet." />
    </div>
  )
}
