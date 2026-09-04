import { useEffect, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { Link } from 'react-router-dom'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Badge, ErrorState, PageHeader } from '../../components/ui'
import { Select } from '../../components/forms'
import { listCertificates } from '../../services/adminCertificateService'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'REVOKED', label: 'Revoked' },
]

const STATUS_VARIANTS = { ACTIVE: 'success', REVOKED: 'danger' }

const LIMIT = 20

export default function CertificateListPage() {
  const [certificates, setCertificates] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadCertificates = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listCertificates({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: LIMIT,
      })
      setCertificates(response.data.certificates)
      setTotal(response.meta.total)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    loadCertificates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter])

  if (hasError) return <ErrorState onRetry={loadCertificates} />

  const columns = [
    {
      key: 'certificate_number',
      header: 'Certificate #',
      render: (row) => (
        <Link to={`/admin/certificates/${row.id}`} className="text-sm text-primary hover:underline">
          {row.certificate_number}
        </Link>
      ),
    },
    { key: 'full_name', header: 'Freelancer' },
    { key: 'partner_id', header: 'Partner ID', render: (row) => row.partner_id ?? '—' },
    { key: 'title', header: 'Title' },
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
      <PageHeader title="Certificates" description="View, regenerate, and revoke issued certificates." />
      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search by certificate #, name, or partner ID" />
        <Select
          id="statusFilter"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
      </FilterBar>
      <Table columns={columns} data={certificates} isLoading={isLoading} emptyMessage="No certificates found." />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />
    </div>
  )
}
