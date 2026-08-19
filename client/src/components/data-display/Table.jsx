import LoadingState from '../ui/LoadingState'
import EmptyState from '../ui/EmptyState'

export default function Table({ columns, data, isLoading, emptyMessage = 'No records found.', rowKey = 'id' }) {
  if (isLoading) return <LoadingState label="Loading data..." />
  if (!data?.length) return <EmptyState title={emptyMessage} />

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-surface-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-medium text-text-secondary"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {data.map((row) => (
            <tr key={row[rowKey]} className="hover:bg-surface-muted">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-text-primary">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
