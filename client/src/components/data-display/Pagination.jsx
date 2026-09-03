import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../ui/Button'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <p className="text-sm text-text-secondary">
        Page <span className="font-semibold text-text-primary">{page}</span> of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </Button>
      </div>
    </div>
  )
}
