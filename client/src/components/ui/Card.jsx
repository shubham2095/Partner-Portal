import { cn } from '../../utils/cn'

export default function Card({ children, className, elevated = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface p-4',
        elevated ? 'shadow-elevated' : 'shadow-card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
