import { cn } from '../../utils/cn'
import LoadingState from '../ui/LoadingState'
import EmptyState from '../ui/EmptyState'

export default function Table({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found.',
  rowKey = 'id',
  onRowClick,
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface">
        <LoadingState label="Loading data..." />
      </div>
    )
  }
  if (!data?.length) {
    return <EmptyState title={emptyMessage} />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="sticky top-0 z-10 border-b border-border bg-surface-muted/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.04em] text-text-secondary backdrop-blur"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer',
                  'hover:bg-primary-50/40'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="border-b border-border px-4 py-3 text-text-primary [tr:last-child_&]:border-b-0"
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
