import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const Radio = forwardRef(function Radio({ label, className, id, ...props }, ref) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-text-primary">
      <input
        id={id}
        ref={ref}
        type="radio"
        className={cn('h-4 w-4 border-border text-primary focus-ring', className)}
        {...props}
      />
      {label}
    </label>
  )
})

export default Radio
