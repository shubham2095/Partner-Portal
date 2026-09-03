import { cn } from '../../utils/cn'

export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="scrollbar-thin -mb-px flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors focus-ring-visible',
              isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary transition-opacity duration-150',
                isActive ? 'opacity-100' : 'opacity-0'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
