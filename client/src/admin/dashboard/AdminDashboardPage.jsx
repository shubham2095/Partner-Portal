import { StatCard } from '../../components/data-display'

const METRICS = [
  { label: 'Total Freelancers', value: '0' },
  { label: 'Active Freelancers', value: '0' },
  { label: 'Certified Freelancers', value: '0' },
  { label: 'Total Leads', value: '0' },
  { label: 'Unassigned Leads', value: '0' },
  { label: 'Converted Leads', value: '0' },
  { label: 'Revenue', value: '₹0' },
  { label: 'Commission Payable', value: '₹0' },
]

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2>Admin Dashboard</h2>
        <p className="text-sm text-text-secondary">
          Foundation placeholder — live data arrives in later phases.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
    </div>
  )
}
