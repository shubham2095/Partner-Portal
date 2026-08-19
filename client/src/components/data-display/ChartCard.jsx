import Card from '../ui/Card'

export default function ChartCard({ title, children, actions }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {actions}
      </div>
      <div className="h-64 w-full">{children}</div>
    </Card>
  )
}
