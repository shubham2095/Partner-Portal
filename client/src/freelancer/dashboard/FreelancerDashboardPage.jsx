import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatCard } from '../../components/data-display'
import { Card, Badge, ProgressBar } from '../../components/ui'
import { getDashboardSummary } from '../../services/freelancerTrainingService'

const METRICS = [
  { label: 'Total Leads', value: '0' },
  { label: 'New Leads', value: '0' },
  { label: "Follow-ups Today", value: '0' },
  { label: 'Commission Earned', value: '₹0' },
]

export default function FreelancerDashboardPage() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2>Welcome back</h2>
        <p className="text-sm text-text-secondary">
          Foundation placeholder — live data arrives in later phases.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {METRICS.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      {summary && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Learning &amp; Certification</h3>
            <Badge variant="info">{summary.certificationState}</Badge>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Training progress</span>
              <span>
                {summary.totalCompleted}/{summary.totalEnrolled} courses completed
              </span>
            </div>
            <ProgressBar value={summary.averageProgress} />
          </div>
          {summary.recentActivity.length > 0 && (
            <div className="flex flex-col gap-1 pt-2">
              <span className="text-xs font-medium text-text-secondary">Recent activity</span>
              {summary.recentActivity.map((item) => (
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
          <Link to="/freelancer/training" className="text-sm text-primary hover:underline">
            Browse Training Library →
          </Link>
        </Card>
      )}
    </div>
  )
}
