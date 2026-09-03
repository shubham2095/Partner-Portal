// Single source of truth for the look of every form control (Input, Select,
// Textarea, PasswordInput, FileUpload). Keeping this here means the whole
// portal's fields stay visually identical — border, radius, padding, focus
// ring and disabled treatment — without each component redefining them.
import { cn } from '../../utils/cn'

export const fieldBase =
  'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary ' +
  'placeholder:text-text-muted shadow-xs transition-[border-color,box-shadow] duration-150 ease-smooth ' +
  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-secondary disabled:opacity-70'

export const fieldError = 'border-danger focus:border-danger focus:ring-danger/20'

export const fieldLabel = 'text-sm font-medium text-text-primary'

export const fieldErrorText = 'text-xs font-medium text-danger'

export function fieldClass(hasError, className) {
  return cn(fieldBase, hasError && fieldError, className)
}
