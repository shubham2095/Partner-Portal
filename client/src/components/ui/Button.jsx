import { cn } from '../../utils/cn'

const VARIANTS = {
  primary:
    'bg-primary text-white shadow-xs hover:bg-primary-hover active:bg-primary-800',
  secondary:
    'bg-surface text-text-primary border border-border shadow-xs hover:bg-surface-muted hover:border-border-strong active:bg-surface-muted',
  danger: 'bg-danger text-white shadow-xs hover:bg-danger-hover active:bg-danger-hover',
  success: 'bg-success text-white shadow-xs hover:bg-success-hover active:bg-success-hover',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary',
  outline:
    'bg-transparent text-primary border border-primary/40 hover:bg-primary-50 hover:border-primary/60',
}

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-lg font-medium',
        'transition-all duration-150 ease-smooth focus-ring-visible',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
