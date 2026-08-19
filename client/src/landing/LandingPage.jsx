import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import HealthCheck from '../components/HealthCheck'

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center"
    >
      <h1>Digital Marketing Partner Portal</h1>
      <p className="text-text-secondary">
        Learn, get certified, receive leads, sell, and earn commission as an authorized digital
        marketing partner.
      </p>
      <div className="flex gap-3">
        <Link to="/auth/login">
          <Button>Partner Login</Button>
        </Link>
        <Link to="/auth/register">
          <Button variant="secondary">Become a Partner</Button>
        </Link>
      </div>
      <HealthCheck />
    </motion.div>
  )
}
