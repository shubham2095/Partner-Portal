import { motion } from 'framer-motion'
import Card from '../ui/Card'

export default function StatCard({ label, value, icon, trend }) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-sm text-text-secondary">{label}</p>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-2xl font-semibold text-text-primary"
        >
          {value}
        </motion.p>
        {trend && <p className="mt-1 text-xs text-text-muted">{trend}</p>}
      </div>
      {icon && <div className="text-primary">{icon}</div>}
    </Card>
  )
}
