import { Sun, Moon } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { cn } from '../../utils/cn'

export default function ThemeToggle({ className }) {
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-ring-visible',
        className
      )}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" strokeWidth={2} /> : <Moon className="h-5 w-5" strokeWidth={2} />}
    </button>
  )
}
