import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Badge, Card } from '../components/ui'
import { Input } from '../components/forms'
import { verifyCertificate } from '../services/verificationService'

const STATUS_COPY = {
  NOT_FOUND: { title: 'Certificate Not Found', variant: 'danger', message: 'No certificate exists with this number. Please check and try again.' },
  REVOKED: { title: 'Certificate Revoked', variant: 'danger', message: 'This certificate has been revoked and is no longer valid.' },
  ACTIVE: { title: 'Certificate Verified', variant: 'success', message: 'This is a valid, currently active certificate.' },
}

export default function VerifyCertificatePage() {
  const { certificateNumber: initialNumber } = useParams()
  const [certificateNumber, setCertificateNumber] = useState(initialNumber ?? '')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleVerify = async (event) => {
    event?.preventDefault()
    if (!certificateNumber.trim()) return
    setIsLoading(true)
    setHasSearched(true)
    try {
      const data = await verifyCertificate(certificateNumber.trim())
      setResult(data)
    } catch (error) {
      setResult({ verified: false, status: 'NOT_FOUND' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (initialNumber) handleVerify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNumber])

  const copy = result ? STATUS_COPY[result.status] ?? STATUS_COPY.NOT_FOUND : null

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-text-primary">Verify Certificate</h1>
        <p className="text-sm text-text-secondary">
          Enter a certificate number to confirm its authenticity and status.
        </p>
      </div>

      <form onSubmit={handleVerify} className="flex gap-2">
        <Input
          id="certificateNumber"
          placeholder="CERT-2026-000001"
          value={certificateNumber}
          onChange={(event) => setCertificateNumber(event.target.value)}
          className="flex-1"
        />
        <Button type="submit" isLoading={isLoading}>
          Verify
        </Button>
      </form>

      {hasSearched && !isLoading && result && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">{copy.title}</h2>
            <Badge variant={copy.variant}>{result.status}</Badge>
          </div>
          <p className="text-sm text-text-secondary">{copy.message}</p>

          {result.verified && (
            <div className="grid grid-cols-1 gap-2 pt-2 text-sm text-text-secondary sm:grid-cols-2">
              <span>Certificate #: {result.certificateNumber}</span>
              <span>Title: {result.title}</span>
              <span>Freelancer: {result.freelancerName ?? '—'}</span>
              <span>Partner ID: {result.partnerId ?? '—'}</span>
              <span>Issued: {result.issuedAt ? new Date(result.issuedAt).toLocaleDateString() : '—'}</span>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
