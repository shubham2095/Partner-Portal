import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const Checkbox = forwardRef(function Checkbox({ label, className, id, ...props }, ref) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-text-primary">
      <input
        id={id}
        ref={ref}
        type="checkbox"
        className={cn('h-4 w-4 rounded border-border text-primary focus-ring', className)}
        {...props}
      />
      {label}
    </label>
  )
})

export default Checkbox
