import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Target, Sparkles, CalendarClock, Wallet, GraduationCap, ArrowRight, CalendarCheck2, AlertTriangle } from 'lucide-react'
import { StatCard, ChartCard } from '../../components/data-display'
import { Card, Badge, ProgressBar, ErrorState, EmptyState, Skeleton } from '../../components/ui'
import { getDashboardSummary } from '../../services/freelancerTrainingService'
import { getMySummary, getMyPipeline, getMyPerformanceTrend } from '../../services/freelancerAnalyticsService'
import { listMyFollowUps } from '../../services/freelancerLeadService'
import { useAuthStore } from '../../store/authStore'

const CHART_COLOR = '#4f46e5'
const CHART_COLOR_SUCCESS = '#16a34a'
const AXIS_STYLE = { fontSize: 12, fill: '#94a3b8' }
const TOOLTIP_STYLE = {
  contentStyle: { borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 },
  labelStyle: { color: '#0f172a', fontWeight: 600 },
}

function formatCurrency(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN')}`
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

export default function FreelancerDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [trainingSummary, setTrainingSummary] = useState(null)
  const [analyticsSummary, setAnalyticsSummary] = useState(null)
  const [pipeline, setPipeline] = useState(null)
  const [performanceTrend, setPerformanceTrend] = useState(null)
  const [followUpCounts, setFollowUpCounts] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadAll = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const [summaryData, pipelineData, trendData, todayFu, overdueFu, upcomingFu] = await Promise.all([
        getMySummary(),
        getMyPipeline(),
        getMyPerformanceTrend({}),
        listMyFollowUps({ bucket: 'today', limit: 1 }),
        listMyFollowUps({ bucket: 'overdue', limit: 1 }),
        listMyFollowUps({ bucket: 'upcoming', limit: 1 }),
      ])
      setAnalyticsSummary(summaryData)
      setPipeline(pipelineData)
      setPerformanceTrend(trendData)
      setFollowUpCounts({ today: todayFu.meta.total, overdue: overdueFu.meta.total, upcoming: upcomingFu.meta.total })
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    getDashboardSummary()
      .then(setTrainingSummary)
      .catch(() => setTrainingSummary(null))
  }, [])

  if (isLoading) return <DashboardSkeleton />
  if (hasError) return <ErrorState title="Unable to load your dashboard" onRetry={loadAll} />

  const firstName = user?.full_name?.split(' ')[0]
  const METRICS = [
    { label: 'Total Leads', value: analyticsSummary.totalLeads, icon: Target, accent: 'default' },
    { label: 'New Leads Today', value: analyticsSummary.newLeadsToday, icon: Sparkles, accent: 'info' },
    { label: 'Follow-ups Today', value: analyticsSummary.followUpsToday, icon: CalendarClock, accent: 'warning' },
    { label: 'Commission Earned', value: formatCurrency(analyticsSummary.commissionEarned), icon: Wallet, accent: 'success' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Welcome back{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary">Here's what's happening with your pipeline today.</p>
        </div>
        <div className="flex items-center gap-2">
          {analyticsSummary.partnerLevel && (
            <Badge variant="info">{analyticsSummary.partnerLevel.replace('_', ' ')}</Badge>
          )}
          {analyticsSummary.status && <Badge variant="success">{analyticsSummary.status}</Badge>}
        </div>
      </div>

      {followUpCounts && (followUpCounts.today > 0 || followUpCounts.overdue > 0) && (
        <Link
          to="/freelancer/follow-ups"
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
            followUpCounts.overdue > 0
              ? 'border-danger/20 bg-danger-bg text-danger hover:bg-danger-bg/70'
              : 'border-warning/20 bg-warning-bg text-warning hover:bg-warning-bg/70'
          }`}
        >
          <span className="flex items-center gap-2 font-medium">
            {followUpCounts.overdue > 0 ? (
              <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
            ) : (
              <CalendarCheck2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            )}
            {followUpCounts.overdue > 0
              ? `You have ${followUpCounts.overdue} overdue follow-up${followUpCounts.overdue === 1 ? '' : 's'}`
              : `You have ${followUpCounts.today} follow-up${followUpCounts.today === 1 ? '' : 's'} due today`}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4">
        {METRICS.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} accent={metric.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="My Pipeline" description="Leads by current status">
          {!pipeline || pipeline.length === 0 ? (
            <EmptyState icon={Target} title="Your pipeline is empty" description="New assigned leads will appear here." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipeline} layout="vertical" margin={{ left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="status" width={116} tick={{ ...AXIS_STYLE, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Leads" fill={CHART_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Performance Trend" description="Leads received vs. converted">
          {!performanceTrend || performanceTrend.series.length === 0 ? (
            <EmptyState icon={Sparkles} title="No performance data yet" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrend.series} margin={{ left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="converted" name="Converted" stroke={CHART_COLOR_SUCCESS} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {followUpCounts && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <CalendarClock className="h-4 w-4 text-primary" strokeWidth={2} /> Follow-ups
            </h3>
            <Link to="/freelancer/follow-ups" className="text-xs font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md bg-warning-bg p-3">
              <p className="text-caption">Today</p>
              <p className="mt-1 text-lg font-bold text-warning">{followUpCounts.today}</p>
            </div>
            <div className="rounded-md bg-danger-bg p-3">
              <p className="text-caption">Overdue</p>
              <p className="mt-1 text-lg font-bold text-danger">{followUpCounts.overdue}</p>
            </div>
            <div className="rounded-md bg-surface-muted p-3">
              <p className="text-caption">Upcoming</p>
              <p className="mt-1 text-lg font-bold text-text-primary">{followUpCounts.upcoming}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Wallet className="h-4 w-4 text-primary" strokeWidth={2} /> Earnings Breakdown
          </h3>
          <Link to="/freelancer/commissions" className="text-xs font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md bg-surface-muted p-3">
            <p className="text-caption">Earned</p>
            <p className="mt-1 text-lg font-bold text-text-primary">{formatCurrency(analyticsSummary.commissionEarned)}</p>
          </div>
          <div className="rounded-md bg-warning-bg p-3">
            <p className="text-caption">Pending</p>
            <p className="mt-1 text-lg font-bold text-warning">{formatCurrency(analyticsSummary.commissionPending)}</p>
          </div>
          <div className="rounded-md bg-success-bg p-3">
            <p className="text-caption">Paid</p>
            <p className="mt-1 text-lg font-bold text-success">{formatCurrency(analyticsSummary.commissionPaid)}</p>
          </div>
        </div>
      </Card>

      {trainingSummary && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <GraduationCap className="h-4 w-4 text-primary" strokeWidth={2} /> Learning &amp; Certification
            </h3>
            <Badge variant="info">{trainingSummary.certificationState}</Badge>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Training progress</span>
              <span>
                {trainingSummary.totalCompleted}/{trainingSummary.totalEnrolled} courses completed
              </span>
            </div>
            <ProgressBar value={trainingSummary.averageProgress} />
          </div>
          {trainingSummary.recentActivity.length > 0 && (
            <div className="flex flex-col gap-1 pt-2">
              <span className="text-caption">Recent activity</span>
              {trainingSummary.recentActivity.map((item) => (
                <Link
                  key={item.trainingId}
                  to={`/freelancer/training/${item.trainingId}`}
                  className="flex items-center justify-between text-sm text-text-primary hover:underline"
                >
                  <span>{item.trainingTitle}</span>
                  <Badge variant={item.status === 'COMPLETED' ? 'success' : 'default'}>{item.progressPercentage}%</Badge>
                </Link>
              ))}
            </div>
          )}
          <Link to="/freelancer/training" className="flex items-center gap-1 text-sm text-primary hover:underline">
            Browse Training Library <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </Card>
      )}
    </div>
  )
}
