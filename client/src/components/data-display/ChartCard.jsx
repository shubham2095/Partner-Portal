import Card from '../ui/Card'

export default function ChartCard({ title, children, actions, description }) {
  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="h-64 w-full">{children}</div>
    </Card>
  )
}
