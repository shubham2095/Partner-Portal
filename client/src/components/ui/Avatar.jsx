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
        className={cn('rounded-full object-cover ring-1 ring-inset ring-black/5', className)}
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'flex select-none items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-semibold text-white ring-1 ring-inset ring-black/5',
        className
      )}
    >
      {initials || '?'}
    </div>
  )
}
