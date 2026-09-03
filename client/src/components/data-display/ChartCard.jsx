import Card from '../ui/Card'

export default function ChartCard({ title, children, actions, description }) {
  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className="h-64 w-full flex-1">{children}</div>
    </Card>
  )
}
