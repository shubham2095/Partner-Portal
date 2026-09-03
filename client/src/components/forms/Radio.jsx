import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const Radio = forwardRef(function Radio({ label, className, id, ...props }, ref) {
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-text-primary select-none"
    >
      <input
        id={id}
        ref={ref}
        type="radio"
        className={cn(
          'h-4 w-4 border-border-strong text-primary transition-shadow',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1',
          className
        )}
        {...props}
      />
      {label}
    </label>
  )
})

export default Radio
