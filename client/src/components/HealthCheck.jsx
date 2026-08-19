import { useEffect, useState } from 'react'
import { getApiHealth } from '../services/healthService'
import Badge from './ui/Badge'

export default function HealthCheck() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    getApiHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'))
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      <span>API status:</span>
      {status === 'checking' && <Badge variant="default">Checking...</Badge>}
      {status === 'online' && <Badge variant="success">Online</Badge>}
      {status === 'offline' && <Badge variant="danger">Offline</Badge>}
    </div>
  )
}
