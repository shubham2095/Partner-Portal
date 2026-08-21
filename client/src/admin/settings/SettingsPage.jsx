import { Link } from 'react-router-dom'
import { Card, Badge, PageHeader } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Settings" description="Your admin account details." />

      <Card className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-text-primary">Account</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-text-secondary">Email</p>
            <p className="text-sm font-medium text-text-primary">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Role</p>
            <Badge variant="info">{user?.role ?? '—'}</Badge>
          </div>
          {user?.created_at && (
            <div>
              <p className="text-xs text-text-secondary">Account Created</p>
              <p className="text-sm font-medium text-text-primary">{user.created_at}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-text-primary">Password</h3>
        <p className="text-sm text-text-secondary">
          To change your password, use the password reset flow.
        </p>
        <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
          Reset Password →
        </Link>
      </Card>
    </div>
  )
}
