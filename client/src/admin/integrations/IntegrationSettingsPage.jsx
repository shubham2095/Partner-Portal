import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Table, Pagination } from '../../components/data-display'
import { Button, Badge, Card, ErrorState, PageHeader } from '../../components/ui'
import { getConfigs, toggleConfig, getWebhookEvents, getAutomationLogs } from '../../services/adminIntegrationService'

const PROVIDER_LABELS = {
  META_LEAD_ADS: 'Meta Lead Ads',
  GOOGLE_LEAD_FORMS: 'Google Lead Forms',
  WHATSAPP: 'WhatsApp Business API',
  SMS: 'SMS',
  RAZORPAY: 'Razorpay',
  STRIPE: 'Stripe',
  S3: 'S3 / Cloud Storage',
  AUTO_ASSIGNMENT: 'Automatic Lead Distribution (round-robin)',
}

const ALL_PROVIDERS = Object.keys(PROVIDER_LABELS)

const EVENT_STATUS_VARIANTS = {
  RECEIVED: 'info',
  PROCESSED: 'success',
  REJECTED: 'danger',
  DUPLICATE: 'default',
}

const LIMIT = 20

export default function IntegrationSettingsPage() {
  const [configs, setConfigs] = useState([])
  const [events, setEvents] = useState([])
  const [eventsTotal, setEventsTotal] = useState(0)
  const [eventsPage, setEventsPage] = useState(1)
  const [logs, setLogs] = useState([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsPage, setLogsPage] = useState(1)
  const [hasError, setHasError] = useState(false)

  const loadConfigs = async () => {
    try {
      setConfigs(await getConfigs())
    } catch (error) {
      setHasError(true)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await getWebhookEvents({ page: eventsPage, limit: LIMIT })
      setEvents(response.data.events)
      setEventsTotal(response.meta.total)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const loadLogs = async () => {
    try {
      const response = await getAutomationLogs({ page: logsPage, limit: LIMIT })
      setLogs(response.data.logs)
      setLogsTotal(response.meta.total)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsPage])

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsPage])

  const handleToggle = async (provider, currentlyEnabled) => {
    try {
      await toggleConfig(provider, !currentlyEnabled)
      toast.success(`${PROVIDER_LABELS[provider]} ${!currentlyEnabled ? 'enabled' : 'disabled'}`)
      await loadConfigs()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (hasError) return <ErrorState onRetry={loadConfigs} />

  const configByProvider = new Map(configs.map((c) => [c.provider, c]))

  const eventColumns = [
    { key: 'provider', header: 'Provider' },
    { key: 'external_event_id', header: 'External ID' },
    {
      key: 'signature_valid',
      header: 'Signature',
      render: (row) => <Badge variant={row.signature_valid ? 'success' : 'danger'}>{row.signature_valid ? 'Valid' : 'Invalid'}</Badge>,
    },
    {
      key: 'processing_status',
      header: 'Status',
      render: (row) => <Badge variant={EVENT_STATUS_VARIANTS[row.processing_status] ?? 'default'}>{row.processing_status}</Badge>,
    },
    { key: 'error_message', header: 'Error', render: (row) => row.error_message ?? '—' },
    { key: 'received_at', header: 'Received', render: (row) => new Date(row.received_at).toLocaleString() },
  ]

  const logColumns = [
    { key: 'job_name', header: 'Job' },
    { key: 'run_at', header: 'Run At', render: (row) => new Date(row.run_at).toLocaleString() },
    { key: 'records_processed', header: 'Processed' },
    { key: 'records_succeeded', header: 'Succeeded' },
    { key: 'records_failed', header: 'Failed' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Integrations"
        description="Adapters for external lead sources and notification channels. Credentials are configured via server environment variables and are never exposed here."
      />

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Providers</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ALL_PROVIDERS.map((provider) => {
            const config = configByProvider.get(provider)
            const isEnabled = Boolean(config?.is_enabled)
            return (
              <div key={provider} className="flex items-center justify-between rounded border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{PROVIDER_LABELS[provider]}</p>
                  <Badge variant={isEnabled ? 'success' : 'default'}>{isEnabled ? 'Enabled' : 'Disabled'}</Badge>
                </div>
                <Button size="sm" variant="secondary" onClick={() => handleToggle(provider, isEnabled)}>
                  {isEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Webhook Events</h3>
        <Table columns={eventColumns} data={events} emptyMessage="No webhook events received yet." />
        <Pagination page={eventsPage} totalPages={Math.max(1, Math.ceil(eventsTotal / LIMIT))} onPageChange={setEventsPage} />
      </Card>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Automation Logs</h3>
        <Table columns={logColumns} data={logs} emptyMessage="No automation runs recorded yet." />
        <Pagination page={logsPage} totalPages={Math.max(1, Math.ceil(logsTotal / LIMIT))} onPageChange={setLogsPage} />
      </Card>
    </div>
  )
}
