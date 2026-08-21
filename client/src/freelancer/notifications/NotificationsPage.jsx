import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Bell, UserPlus, CheckCircle2, Wallet, Receipt, Video, GraduationCap, CalendarClock, BellOff } from 'lucide-react'
import { Pagination } from '../../components/data-display'
import { Button, Badge, Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui'
import {
  listNotifications,
  markRead,
  markAllRead,
  getPreferences,
  updatePreferences,
} from '../../services/notificationService'
import { cn } from '../../utils/cn'

const TYPE_META = {
  LEAD_ASSIGNED: { label: 'Lead Assigned', icon: UserPlus },
  LEAD_CONVERTED: { label: 'Lead Converted', icon: CheckCircle2 },
  COMMISSION_STATUS_CHANGED: { label: 'Commission Update', icon: Wallet },
  PAYMENT_RECORDED: { label: 'Payment Recorded', icon: Receipt },
  WEBINAR_REGISTRATION_CONFIRMED: { label: 'Webinar Registration', icon: Video },
  TRAINING_PUBLISHED: { label: 'New Training', icon: GraduationCap },
  FOLLOWUP_REMINDER: { label: 'Follow-up Reminder', icon: CalendarClock },
}

const LIMIT = 20

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('loading')
  const [preferences, setPreferences] = useState(null)

  const loadAll = async () => {
    setStatus('loading')
    try {
      const [response, prefs] = await Promise.all([listNotifications({ page, limit: LIMIT }), getPreferences()])
      setNotifications(response.data.notifications)
      setTotal(response.meta.total)
      setPreferences(prefs)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleMarkRead = async (id) => {
    try {
      await markRead(id)
      await loadAll()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead()
      toast.success('All notifications marked as read')
      await loadAll()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const handleTogglePreference = async (key) => {
    try {
      const next = await updatePreferences({
        emailEnabled: key === 'email_enabled' ? !preferences.email_enabled : Boolean(preferences.email_enabled),
        whatsappEnabled: key === 'whatsapp_enabled' ? !preferences.whatsapp_enabled : Boolean(preferences.whatsapp_enabled),
      })
      setPreferences(next)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (status === 'loading') return <LoadingState label="Loading notifications..." />
  if (status === 'error') return <ErrorState title="Unable to load notifications" onRetry={loadAll} />

  const unreadCount = notifications.filter((n) => !n.read_at).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
        actions={
          unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
              Mark All Read
            </Button>
          )
        }
      />

      <Card className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-text-primary">Preferences</h3>
        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(preferences?.email_enabled)}
              onChange={() => handleTogglePreference('email_enabled')}
              className="accent-primary"
            />
            Email notifications
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(preferences?.whatsapp_enabled)}
              onChange={() => handleTogglePreference('whatsapp_enabled')}
              className="accent-primary"
            />
            WhatsApp notifications
          </label>
        </div>
      </Card>

      {notifications.length === 0 ? (
        <EmptyState icon={BellOff} title="You're all caught up." description="New notifications will show up here." />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => {
            const meta = TYPE_META[notification.type]
            const Icon = meta?.icon ?? Bell
            const isUnread = !notification.read_at
            return (
              <Card
                key={notification.id}
                className={cn(
                  'flex items-start gap-3 border-l-4 transition-colors hover:bg-surface-muted/50',
                  isUnread ? 'border-l-primary' : 'border-l-transparent opacity-70'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    isUnread ? 'bg-primary-50 text-primary' : 'bg-surface-muted text-text-muted'
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">{meta?.label ?? notification.type}</Badge>
                    {isUnread && <Badge variant="warning">New</Badge>}
                  </div>
                  <p className="mt-1 text-sm font-medium text-text-primary">{notification.title}</p>
                  {notification.message && <p className="text-sm text-text-secondary">{notification.message}</p>}
                  <p className="mt-0.5 text-xs text-text-muted">{new Date(notification.created_at).toLocaleString()}</p>
                </div>
                {isUnread && (
                  <Button size="sm" variant="ghost" onClick={() => handleMarkRead(notification.id)}>
                    Mark Read
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />
    </div>
  )
}
