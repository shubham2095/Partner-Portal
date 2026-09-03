import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Users,
  UserCheck,
  Award,
  Target,
  CircleAlert,
  CheckCircle2,
  Wallet,
  HandCoins,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  LifeBuoy,
  Sparkles,
} from 'lucide-react'
import { StatCard, ChartCard } from '../../components/data-display'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'
import {
  getOverview,
  getLeadsOverTime,
  getConversionFunnel,
  getRevenueTrend,
  getFreelancerPerformance,
  getWebinarFunnel,
} from '../../services/adminAnalyticsService'
import { listFreelancers } from '../../services/adminFreelancerService'
import { listWithdrawals } from '../../services/adminWithdrawalService'
import { getDashboardCounts as getTicketCounts } from '../../services/adminTicketService'

const CHART_COLOR = '#7c3aed'
const CHART_COLOR_SUCCESS = '#059669'
const AXIS_STYLE = { fontSize: 12, fill: '#9997a8' }
const TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid #e8e7f0',
    fontSize: 13,
    boxShadow: '0 8px 16px -4px rgba(28,27,41,0.14)',
  },
  labelStyle: { color: '#1c1b29', fontWeight: 600 },
  cursor: { fill: 'rgba(124,58,237,0.06)' },
}

function formatCurrency(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN')}`
}

const TODAY = new Date().toLocaleDateString('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return <p className="text-caption">{children}</p>
}

function AttentionTile({ icon: Icon, count, label, to, tone }) {
  const tones = {
    warning: 'bg-warning-bg text-warning ring-warning/15',
    accent: 'bg-accent-bg text-accent-hover ring-accent/15',
    info: 'bg-info-bg text-info ring-info/15',
    primary: 'bg-primary-50 text-primary ring-primary-100',
  }
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-border-strong hover:bg-surface-muted/50"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tones[tone]}`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold leading-none text-text-primary">{count}</p>
        <p className="mt-1 truncate text-xs text-text-secondary">{label}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
    </Link>
  )
}

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [overview, setOverview] = useState(null)
  const [leadsOverTime, setLeadsOverTime] = useState(null)
  const [funnel, setFunnel] = useState(null)
  const [revenueTrend, setRevenueTrend] = useState(null)
  const [topFreelancers, setTopFreelancers] = useState(null)
  const [webinarFunnel, setWebinarFunnel] = useState(null)
  const [queue, setQueue] = useState({ pendingProfiles: 0, pendingWithdrawals: 0, openTickets: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadAll = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const [overviewData, leadsData, funnelData, revenueData, performanceData, webinarData] = await Promise.all([
        getOverview(),
        getLeadsOverTime({}),
        getConversionFunnel(),
        getRevenueTrend({}),
        getFreelancerPerformance({ page: 1, limit: 5 }),
        getWebinarFunnel({}),
      ])
      setOverview(overviewData)
      setLeadsOverTime(leadsData)
      setFunnel(funnelData)
      setRevenueTrend(revenueData)
      setTopFreelancers(performanceData.rows)
      setWebinarFunnel(webinarData)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }

    // Non-blocking: the "needs attention" counts. A failure here shouldn't
    // take the whole dashboard down.
    const [profiles, withdrawals, tickets] = await Promise.allSettled([
      listFreelancers({ status: 'PENDING', page: 1, limit: 1 }),
      listWithdrawals({ status: 'PENDING', page: 1, limit: 1 }),
      getTicketCounts(),
    ])
    setQueue({
      pendingProfiles: profiles.status === 'fulfilled' ? profiles.value?.meta?.total ?? 0 : 0,
      pendingWithdrawals: withdrawals.status === 'fulfilled' ? withdrawals.value?.meta?.total ?? 0 : 0,
      openTickets: tickets.status === 'fulfilled' ? tickets.value?.unassignedOpen ?? 0 : 0,
    })
  }

  useEffect(() => {
    loadAll()
  }, [])

  if (isLoading) return <DashboardSkeleton />
  if (hasError) return <ErrorState title="Unable to load the dashboard" onRetry={loadAll} />

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : null

  const HERO_STATS = [
    { label: 'Partners', value: overview.totalFreelancers },
    { label: 'Total leads', value: overview.totalLeads },
    { label: 'Revenue', value: formatCurrency(overview.revenue) },
  ]

  const PARTNER_METRICS = [
    { label: 'Total Freelancers', value: overview.totalFreelancers, icon: Users, accent: 'default' },
    { label: 'Active Freelancers', value: overview.activeFreelancers, icon: UserCheck, accent: 'success' },
    { label: 'Certified Freelancers', value: overview.certifiedFreelancers, icon: Award, accent: 'info' },
    { label: 'Total Leads', value: overview.totalLeads, icon: Target, accent: 'default' },
  ]
  const PIPELINE_METRICS = [
    { label: 'Unassigned Leads', value: overview.unassignedLeads, icon: CircleAlert, accent: 'warning' },
    { label: 'Converted Leads', value: overview.convertedLeads, icon: CheckCircle2, accent: 'success' },
    { label: 'Revenue', value: formatCurrency(overview.revenue), icon: Wallet, accent: 'success' },
    { label: 'Commission Payable', value: formatCurrency(overview.commissionPayable), icon: HandCoins, accent: 'accent' },
  ]

  const attention = [
    overview.unassignedLeads > 0 && {
      icon: Target,
      count: overview.unassignedLeads,
      label: 'Unassigned leads',
      to: '/admin/leads',
      tone: 'warning',
    },
    queue.pendingProfiles > 0 && {
      icon: BadgeCheck,
      count: queue.pendingProfiles,
      label: 'Profiles to verify',
      to: '/admin/freelancers',
      tone: 'primary',
    },
    queue.pendingWithdrawals > 0 && {
      icon: ArrowUpRight,
      count: queue.pendingWithdrawals,
      label: 'Withdrawals to review',
      to: '/admin/withdrawals',
      tone: 'accent',
    },
    queue.openTickets > 0 && {
      icon: LifeBuoy,
      count: queue.openTickets,
      label: 'Unassigned support tickets',
      to: '/admin/tickets',
      tone: 'info',
    },
    Number(overview.commissionPayable) > 0 && {
      icon: HandCoins,
      count: formatCurrency(overview.commissionPayable),
      label: 'Commission payable',
      to: '/admin/commissions',
      tone: 'accent',
    },
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-6">
      {/* ---------- Greeting hero ---------- */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-brand p-6 text-white shadow-elevated sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-accent/20 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">{TODAY}</p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-[1.7rem]">
              Welcome back{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1 text-sm text-white/70">Here’s how the platform is performing today.</p>
          </div>
          <div className="flex gap-6">
            {HERO_STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-xl font-bold leading-none text-white">{s.value}</p>
                <p className="mt-1 text-[0.6875rem] uppercase tracking-wide text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- KPI cards ---------- */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Partners &amp; pipeline</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARTNER_METRICS.map((m) => (
            <StatCard key={m.label} label={m.label} value={m.value} icon={m.icon} accent={m.accent} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <SectionLabel>Conversions &amp; revenue</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE_METRICS.map((m) => (
            <StatCard key={m.label} label={m.label} value={m.value} icon={m.icon} accent={m.accent} />
          ))}
        </div>
      </div>

      {/* ---------- Needs attention ---------- */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-base font-semibold text-text-primary">Needs your attention</h2>
        {attention.length === 0 ? (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-success-bg px-4 py-4 text-sm text-success">
            <Sparkles className="h-4 w-4" strokeWidth={2} />
            You’re all caught up — nothing needs review right now.
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {attention.map((item) => (
              <AttentionTile key={item.label} {...item} />
            ))}
          </div>
        )}
      </div>

      {/* ---------- Analytics ---------- */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Analytics</SectionLabel>
          <span className="rounded-full border border-border bg-surface-muted/60 px-2.5 py-0.5 text-[0.6875rem] font-medium text-text-muted">
            Last 30 days
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Leads Over Time" description="Last 30 days">
            {leadsOverTime.series.length === 0 ? (
              <EmptyState icon={Target} title="No lead data yet" description="Leads created in this period will appear here." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadsOverTime.series} margin={{ left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e7f0" vertical={false} />
                  <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={{ stroke: '#e8e7f0' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="count" name="Leads" stroke={CHART_COLOR} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Conversion Funnel" description="Current lead pipeline by stage">
            {funnel.length === 0 ? (
              <EmptyState icon={Target} title="No lead data yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e7f0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="stage" width={116} tick={{ ...AXIS_STYLE, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="Leads" fill={CHART_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Revenue Trend" description="Confirmed conversions over time">
            {revenueTrend.series.length === 0 ? (
              <EmptyState icon={Wallet} title="No revenue data yet" description="Revenue from converted leads will appear here." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend.series} margin={{ left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e7f0" vertical={false} />
                  <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={{ stroke: '#e8e7f0' }} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLOR_SUCCESS} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Top Freelancer Performance" description="Revenue by freelancer">
            {topFreelancers.length === 0 ? (
              <EmptyState icon={Users} title="No freelancer data yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFreelancers} margin={{ left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e7f0" vertical={false} />
                  <XAxis dataKey="fullName" tick={{ ...AXIS_STYLE, fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} axisLine={{ stroke: '#e8e7f0' }} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Bar dataKey="revenue" name="Revenue" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Webinar Funnel" description="Registration to attendance">
            {!webinarFunnel || webinarFunnel.registered === 0 ? (
              <EmptyState icon={Award} title="No webinar data yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { stage: 'Registered', count: webinarFunnel.registered },
                    { stage: 'Attended', count: webinarFunnel.attended },
                    { stage: 'Absent', count: webinarFunnel.absent },
                  ]}
                  margin={{ left: -12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e7f0" vertical={false} />
                  <XAxis dataKey="stage" tick={AXIS_STYLE} axisLine={{ stroke: '#e8e7f0' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="Count" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
