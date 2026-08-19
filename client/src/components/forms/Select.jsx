import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const Select = forwardRef(function Select(
  { label, error, options = [], className, id, placeholder, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={cn(
          'rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-ring',
          error && 'border-danger',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})

export default Select
