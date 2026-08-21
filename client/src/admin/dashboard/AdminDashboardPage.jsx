import { useEffect, useState } from 'react'
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
import { Users, UserCheck, Award, Target, CircleAlert, CheckCircle2, Wallet, HandCoins } from 'lucide-react'
import { StatCard, ChartCard } from '../../components/data-display'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'
import {
  getOverview,
  getLeadsOverTime,
  getConversionFunnel,
  getRevenueTrend,
  getFreelancerPerformance,
  getWebinarFunnel,
} from '../../services/adminAnalyticsService'

const CHART_COLOR = '#4f46e5'
const CHART_COLOR_SUCCESS = '#16a34a'
const AXIS_STYLE = { fontSize: 12, fill: '#94a3b8' }
const TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 13,
    boxShadow: '0 8px 16px -4px rgba(15,23,42,0.12)',
  },
  labelStyle: { color: '#0f172a', fontWeight: 600 },
}

function formatCurrency(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN')}`
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    </div>
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
  }

  useEffect(() => {
    loadAll()
  }, [])

  if (isLoading) return <DashboardSkeleton />
  if (hasError) return <ErrorState title="Unable to load the dashboard" onRetry={loadAll} />

  const METRICS = [
    { label: 'Total Freelancers', value: overview.totalFreelancers, icon: Users, accent: 'default' },
    { label: 'Active Freelancers', value: overview.activeFreelancers, icon: UserCheck, accent: 'success' },
    { label: 'Certified Freelancers', value: overview.certifiedFreelancers, icon: Award, accent: 'info' },
    { label: 'Total Leads', value: overview.totalLeads, icon: Target, accent: 'default' },
    { label: 'Unassigned Leads', value: overview.unassignedLeads, icon: CircleAlert, accent: 'warning' },
    { label: 'Converted Leads', value: overview.convertedLeads, icon: CheckCircle2, accent: 'success' },
    { label: 'Revenue', value: formatCurrency(overview.revenue), icon: Wallet, accent: 'success' },
    { label: 'Commission Payable', value: formatCurrency(overview.commissionPayable), icon: HandCoins, accent: 'accent' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome back${user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}`}
        description="Here's how the platform is performing today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} accent={metric.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Leads Over Time" description="Last 30 days">
          {leadsOverTime.series.length === 0 ? (
            <EmptyState icon={Target} title="No lead data yet" description="Leads created in this period will appear here." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadsOverTime.series} margin={{ left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="fullName" tick={{ ...AXIS_STYLE, fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="stage" tick={AXIS_STYLE} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Count" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
