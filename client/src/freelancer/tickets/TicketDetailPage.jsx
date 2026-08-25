import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowLeft, Paperclip } from 'lucide-react'
import { Button, Badge, Card, LoadingState, ErrorState } from '../../components/ui'
import { Textarea, FileUpload } from '../../components/forms'
import { cn } from '../../utils/cn'
import { getMyTicketDetail, replyToTicket, downloadMyAttachment } from '../../services/freelancerTicketService'

const STATUS_VARIANTS = {
  OPEN: 'info',
  ASSIGNED: 'info',
  IN_PROGRESS: 'warning',
  WAITING_FOR_FREELANCER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
}
const PRIORITY_VARIANTS = { LOW: 'default', MEDIUM: 'info', HIGH: 'warning', URGENT: 'danger' }

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [status, setStatus] = useState('loading')
  const [replyFile, setReplyFile] = useState(null)

  const replyForm = useForm({ defaultValues: { message: '' } })

  const loadDetail = async () => {
    setStatus('loading')
    try {
      const data = await getMyTicketDetail(id)
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

  const onReply = async (values) => {
    try {
      const formData = new FormData()
      formData.append('message', values.message)
      if (replyFile) formData.append('attachment', replyFile)
      await replyToTicket(id, formData)
      toast.success('Reply posted')
      setReplyFile(null)
      replyForm.reset()
      await loadDetail()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleDownload = async (attachmentId, filename) => {
    try {
      const blob = await downloadMyAttachment(id, attachmentId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (status === 'loading') return <LoadingState label="Loading ticket..." />
  if (status === 'error') return <ErrorState title="Unable to load this ticket" onRetry={loadDetail} />

  const { ticket, messages, attachments } = detail
  const ticketAttachment = attachments.find((a) => a.message_id === null)
  const isClosed = ticket.status === 'CLOSED'

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/freelancer/tickets')} className="w-fit">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Back to Tickets
      </Button>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-text-primary sm:text-xl">
              {ticket.subject} <span className="font-normal text-text-secondary">({ticket.ticket_number})</span>
            </h1>
            <p className="text-sm text-text-secondary">{ticket.category.replace(/_/g, ' ')}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={PRIORITY_VARIANTS[ticket.priority] ?? 'default'}>{ticket.priority}</Badge>
            <Badge variant={STATUS_VARIANTS[ticket.status] ?? 'default'}>{ticket.status.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
        <p className="text-sm text-text-secondary">{ticket.description}</p>
        {ticketAttachment && (
          <button
            type="button"
            onClick={() => handleDownload(ticketAttachment.id, ticketAttachment.original_filename)}
            className="flex w-fit items-center gap-1 text-sm text-primary hover:underline"
          >
            <Paperclip className="h-3.5 w-3.5" strokeWidth={2} /> {ticketAttachment.original_filename}
          </button>
        )}
        <p className="text-xs text-text-secondary">
          Assigned to: {ticket.assigned_admin_email ?? 'Not yet assigned'} · Created {new Date(ticket.created_at).toLocaleString()}
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-text-primary">Conversation</h3>
        {messages.length === 0 && <p className="text-sm text-text-secondary">No replies yet.</p>}
        {messages.map((m) => {
          const attachment = attachments.find((a) => a.message_id === m.id)
          return (
            <div
              key={m.id}
              className={cn('rounded-lg border p-3 text-sm', m.sender_role === 'ADMIN' ? 'border-primary/20 bg-primary-50' : 'border-border bg-surface')}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-text-primary">{m.sender_role === 'ADMIN' ? 'Support Team' : 'You'}</span>
                <span className="text-xs text-text-secondary">{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <p className="text-text-secondary">{m.message}</p>
              {attachment && (
                <button
                  type="button"
                  onClick={() => handleDownload(attachment.id, attachment.original_filename)}
                  className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Paperclip className="h-3 w-3" strokeWidth={2} /> {attachment.original_filename}
                </button>
              )}
            </div>
          )
        })}
      </Card>

      <Card className="flex flex-col gap-3">
        {isClosed ? (
          <p className="text-sm text-text-secondary">This ticket is closed. Ask an admin to reopen it before replying.</p>
        ) : (
          <form onSubmit={replyForm.handleSubmit(onReply)} className="flex flex-col gap-3">
            <Textarea id="message" label="Reply" {...replyForm.register('message', { required: true })} />
            <FileUpload label="Attachment (optional)" accept=".pdf,image/*,.doc,.docx" onChange={setReplyFile} />
            <Button type="submit" className="w-fit" isLoading={replyForm.formState.isSubmitting}>
              Send Reply
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
