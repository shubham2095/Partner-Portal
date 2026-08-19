import { useRef, useState } from 'react'
import { cn } from '../../utils/cn'

export default function FileUpload({ label, error, accept, onChange, className }) {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')

  const handleChange = (event) => {
    const file = event.target.files?.[0]
    setFileName(file?.name ?? '')
    onChange?.(file)
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'rounded border border-dashed border-border bg-surface px-3 py-4 text-sm text-text-secondary hover:bg-surface-muted focus-ring',
          error && 'border-danger',
          className
        )}
      >
        {fileName || 'Click to select a file'}
      </button>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
