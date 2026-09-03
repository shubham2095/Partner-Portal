import { forwardRef } from 'react'
import { fieldClass, fieldLabel, fieldErrorText } from './fieldStyles'

const Textarea = forwardRef(function Textarea({ label, error, hint, className, id, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={fieldLabel}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        ref={ref}
        rows={4}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={fieldClass(Boolean(error), `resize-y leading-relaxed ${className ?? ''}`)}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={fieldErrorText}>
          {error}
        </p>
      )}
    </div>
  )
})

export default Textarea
