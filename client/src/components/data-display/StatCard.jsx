import { motion } from 'framer-motion'
import Card from '../ui/Card'
import { cn } from '../../utils/cn'

const ACCENTS = {
  default: 'bg-primary-50 text-primary',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  accent: 'bg-accent-bg text-accent-hover',
}

export default function StatCard({ label, value, icon: Icon, trend, accent = 'default' }) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-caption">{label}</p>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-1 truncate text-2xl font-bold tracking-tight text-text-primary"
        >
          {value}
        </motion.p>
        {trend && <p className="mt-1 text-xs text-text-muted">{trend}</p>}
      </div>
      {Icon && (
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', ACCENTS[accent])}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      )}
    </Card>
  )
}
