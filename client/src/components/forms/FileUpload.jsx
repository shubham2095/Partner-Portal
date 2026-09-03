import { useRef, useState } from 'react'
import { UploadCloud, FileCheck2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { fieldLabel, fieldErrorText } from './fieldStyles'

export default function FileUpload({ label, error, accept, onChange, className }) {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')

  const handleChange = (event) => {
    const file = event.target.files?.[0]
    setFileName(file?.name ?? '')
    onChange?.(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className={fieldLabel}>{label}</span>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'group flex w-full items-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface-muted/40 px-4 py-3.5 text-left text-sm transition-colors duration-150',
          'hover:border-primary/50 hover:bg-primary-50/50 focus-ring-visible',
          error && 'border-danger bg-danger-bg',
          className
        )}
      >
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
            fileName ? 'bg-success-bg text-success' : 'bg-surface text-text-muted group-hover:text-primary'
          )}
        >
          {fileName ? <FileCheck2 className="h-[18px] w-[18px]" strokeWidth={2} /> : <UploadCloud className="h-[18px] w-[18px]" strokeWidth={2} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-text-primary">
            {fileName || 'Click to select a file'}
          </span>
          <span className="block text-xs text-text-muted">
            {fileName ? 'Click to replace' : 'PDF, image or document'}
          </span>
        </span>
      </button>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      {error && <p className={fieldErrorText}>{error}</p>}
    </div>
  )
}
