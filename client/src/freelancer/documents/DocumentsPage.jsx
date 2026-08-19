import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Select from '../../components/forms/Select'
import FileUpload from '../../components/forms/FileUpload'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { listMyDocuments, uploadMyDocument } from '../../services/freelancerService'

const DOCUMENT_TYPES = [
  { value: 'ID_PROOF', label: 'ID Proof' },
  { value: 'ADDRESS_PROOF', label: 'Address Proof' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'BANK_PROOF', label: 'Bank Proof' },
  { value: 'OTHER', label: 'Other' },
]

const STATUS_VARIANTS = {
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [status, setStatus] = useState('loading')
  const [documentType, setDocumentType] = useState('')
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const loadDocuments = async () => {
    setStatus('loading')
    try {
      const data = await listMyDocuments()
      setDocuments(data)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleUpload = async () => {
    if (!documentType || !file) {
      toast.error('Select a document type and a file before uploading.')
      return
    }
    setIsUploading(true)
    try {
      await uploadMyDocument({ file, documentType })
      toast.success('Document uploaded successfully')
      setFile(null)
      setDocumentType('')
      await loadDocuments()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text-primary">Upload a Document</h2>
        <Select
          id="documentType"
          label="Document Type"
          placeholder="Select document type"
          options={DOCUMENT_TYPES}
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value)}
        />
        <FileUpload
          label="File"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={setFile}
        />
        <Button onClick={handleUpload} isLoading={isUploading} className="w-full sm:w-auto">
          Upload
        </Button>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Your Documents</h2>
        {status === 'loading' && <LoadingState label="Loading documents..." />}
        {status === 'error' && <ErrorState onRetry={loadDocuments} />}
        {status === 'ready' && documents.length === 0 && (
          <EmptyState
            title="No documents uploaded yet"
            description="Upload your ID proof and other required documents."
          />
        )}
        {status === 'ready' && documents.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{document.document_type}</p>
                  <p className="text-xs text-text-secondary">{document.original_filename}</p>
                </div>
                <Badge variant={STATUS_VARIANTS[document.status] ?? 'default'}>{document.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
