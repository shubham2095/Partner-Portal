import { motion } from 'framer-motion'
import Card from '../ui/Card'
import { cn } from '../../utils/cn'

const ACCENTS = {
  default: 'bg-primary-50 text-primary ring-primary-100',
  success: 'bg-success-bg text-success ring-success/15',
  warning: 'bg-warning-bg text-warning ring-warning/15',
  danger: 'bg-danger-bg text-danger ring-danger/15',
  info: 'bg-info-bg text-info ring-info/15',
  accent: 'bg-accent-bg text-accent-hover ring-accent/15',
}

const TREND_TONE = {
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-text-muted',
}

export default function StatCard({ label, value, icon: Icon, trend, trendDirection = 'neutral', accent = 'default' }) {
  return (
    <Card className="flex items-start justify-between gap-3 card-interactive">
      <div className="min-w-0">
        <p className="text-caption">{label}</p>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-1.5 truncate font-display text-[1.7rem] font-bold leading-none tracking-tight text-text-primary"
        >
          {value}
        </motion.p>
        {trend && <p className={cn('mt-2 text-xs font-medium', TREND_TONE[trendDirection])}>{trend}</p>}
      </div>
      {Icon && (
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
            ACCENTS[accent]
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      )}
    </Card>
  )
}
