import { cn } from '../../utils/cn'

export default function Avatar({ name = '', src, size = 36, className }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className={cn('rounded-full object-cover', className)}
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-50 text-sm font-medium text-primary',
        className
      )}
    >
      {initials || '?'}
    </div>
  )
}
