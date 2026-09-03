import { cn } from '../../utils/cn'

export default function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-surface-muted via-surface-muted/60 to-surface-muted',
        className
      )}
    />
  )
}
