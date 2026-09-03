import { forwardRef } from 'react'
import { cn } from '../../utils/cn'
import { fieldClass, fieldLabel, fieldErrorText } from './fieldStyles'

const Select = forwardRef(function Select(
  { label, error, options = [], className, id, placeholder, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={fieldLabel}>
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          fieldClass(Boolean(error), className),
          'cursor-pointer appearance-none bg-[length:1.1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9',
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]"
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
      {error && (
        <p id={`${id}-error`} className={fieldErrorText}>
          {error}
        </p>
      )}
    </div>
  )
})

export default Select
