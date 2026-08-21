import { cn } from '../../utils/cn'

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-700 shadow-sm',
  secondary: 'bg-surface text-text-primary hover:bg-surface-muted border border-border',
  danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
  ghost: 'bg-transparent text-text-primary hover:bg-surface-muted',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
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
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
