import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const Input = forwardRef(function Input({ label, error, className, id, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          'rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-ring',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})

export default Input
