import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Table, Pagination, SearchBar, FilterBar } from '../../components/data-display'
import { Button, Badge, Modal, Card, ErrorState, PageHeader } from '../../components/ui'
import { Input, Select } from '../../components/forms'
import {
  listCommissions,
  createCommission,
  listRules,
  createRule,
  changeRuleStatus,
} from '../../services/adminCommissionService'
import { listLeads } from '../../services/adminLeadService'

const COMMISSION_STATUSES = ['POTENTIAL', 'EARNED', 'APPROVED', 'PAYABLE', 'PAID', 'REJECTED']

const STATUS_VARIANTS = {
  POTENTIAL: 'default',
  EARNED: 'info',
  APPROVED: 'warning',
  PAYABLE: 'warning',
  PAID: 'success',
  REJECTED: 'danger',
}

const LIMIT = 20

export default function CommissionListPage() {
  const [commissions, setCommissions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const [rules, setRules] = useState([])
  const ruleForm = useForm({ defaultValues: { serviceName: '', rateType: 'PERCENTAGE', rateValue: '' } })

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [convertedLeads, setConvertedLeads] = useState([])
  const createForm = useForm({ defaultValues: { leadId: '' } })

  const loadCommissions = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await listCommissions({
        status: statusFilter || undefined,
        search: search || undefined,
        sortBy: 'created_at',
        sortDir: 'DESC',
        page,
        limit: LIMIT,
      })
      setCommissions(response.data.commissions)
      setTotal(response.meta.total)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRules = async () => {
    try {
      setRules(await listRules({}))
    } catch (error) {
      // handled by interceptor toast
    }
  }

  const loadConvertedLeads = async () => {
    try {
      const response = await listLeads({ status: 'CONVERTED', page: 1, limit: 100 })
      setConvertedLeads(response.data.leads)
    } catch (error) {
      // handled by interceptor toast
    }
  }

  useEffect(() => {
    loadRules()
    loadConvertedLeads()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    loadCommissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter])

  const onCreateRule = async (values) => {
    try {
      await createRule(values)
      toast.success('Commission rule created')
      ruleForm.reset()
      await loadRules()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onToggleRuleStatus = async (rule) => {
    try {
      await changeRuleStatus(rule.id, rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
      await loadRules()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  const onCreateCommission = async (values) => {
    try {
      await createCommission(Number(values.leadId))
      toast.success('Commission created')
      setIsCreateOpen(false)
      createForm.reset()
      await loadCommissions()
      await loadConvertedLeads()
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (hasError) return <ErrorState onRetry={loadCommissions} />

  const columns = [
    {
      key: 'lead_number',
      header: 'Lead',
      render: (row) => (
        <Link to={`/admin/commissions/${row.id}`} className="text-primary hover:underline">
          {row.lead_number}
        </Link>
      ),
    },
    { key: 'client_name', header: 'Client' },
    { key: 'freelancer_name', header: 'Freelancer', render: (row) => `${row.freelancer_name} (${row.partner_id ?? '—'})` },
    { key: 'sale_value', header: 'Sale Value', render: (row) => `₹${row.sale_value}` },
    { key: 'commission_amount', header: 'Commission', render: (row) => `₹${row.commission_amount}` },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANTS[row.status] ?? 'default'}>{row.status}</Badge>,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Commissions"
        description="Track commission records, rules and payouts."
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsRulesOpen(true)}>
              Manage Rules
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>Create Commission</Button>
          </>
        }
      />

      <FilterBar>
        <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search client, lead number, freelancer" />
        <Select
          id="statusFilter"
          options={[{ value: '', label: 'All Statuses' }, ...COMMISSION_STATUSES.map((s) => ({ value: s, label: s }))]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </FilterBar>

      <Table columns={columns} data={commissions} isLoading={isLoading} emptyMessage="No commissions found." />
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / LIMIT))} onPageChange={setPage} />

      <Modal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} title="Manage Commission Rules">
        <div className="flex flex-col gap-4">
          <form onSubmit={ruleForm.handleSubmit(onCreateRule)} className="flex flex-col gap-3">
            <Input id="serviceName" label="Service Name" {...ruleForm.register('serviceName', { required: true })} />
            <Select
              id="rateType"
              label="Rate Type"
              options={[
                { value: 'PERCENTAGE', label: 'Percentage of sale value' },
                { value: 'FIXED', label: 'Fixed amount' },
              ]}
              {...ruleForm.register('rateType')}
            />
            <Input id="rateValue" label="Rate Value" type="number" step="0.01" {...ruleForm.register('rateValue', { required: true })} />
            <Button type="submit" size="sm" isLoading={ruleForm.formState.isSubmitting}>
              Add Rule
            </Button>
          </form>
          <Card className="flex flex-col gap-2">
            {rules.length === 0 && <p className="text-sm text-text-secondary">No commission rules yet.</p>}
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {rule.service_name} — {rule.rate_type === 'PERCENTAGE' ? `${rule.rate_value}%` : `₹${rule.rate_value}`}
                  </p>
                  <Badge variant={rule.status === 'ACTIVE' ? 'success' : 'default'}>{rule.status}</Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onToggleRuleStatus(rule)}>
                  {rule.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ))}
          </Card>
        </div>
      </Modal>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Commission">
        <form onSubmit={createForm.handleSubmit(onCreateCommission)} className="flex flex-col gap-4">
          <Select
            id="leadId"
            label="Converted Lead"
            options={[
              { value: '', label: 'Select a converted lead' },
              ...convertedLeads.map((lead) => ({
                value: String(lead.id),
                label: `${lead.lead_number} — ${lead.client_name} (₹${lead.conversion_value ?? 0})`,
              })),
            ]}
            {...createForm.register('leadId', { required: true })}
          />
          <p className="text-xs text-text-secondary">
            Only converted leads with an assigned freelancer and a matching active commission rule for their service are eligible.
          </p>
          <Button type="submit" isLoading={createForm.formState.isSubmitting}>
            Create Commission
          </Button>
        </form>
      </Modal>
    </div>
  )
}
