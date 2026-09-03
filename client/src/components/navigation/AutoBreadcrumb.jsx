import { useLocation } from 'react-router-dom'
import Breadcrumb from './Breadcrumb'

// Human labels for known path segments across both portals. Anything not
// listed falls back to a Title-Cased version of the segment; a purely
// numeric segment (a record id) renders as "Details".
const SEGMENT_LABELS = {
  admin: 'Admin',
  freelancer: 'Portal',
  dashboard: 'Dashboard',
  freelancers: 'Freelancers',
  leads: 'Leads',
  'follow-ups': 'Follow-ups',
  webinars: 'Webinars',
  questions: 'Questions',
  tests: 'Tests',
  certificates: 'Certificates',
  training: 'Training',
  lessons: 'Lesson',
  sales: 'Sales',
  commissions: 'Commissions',
  withdrawals: 'Withdrawals',
  reports: 'Reports',
  tickets: 'Support',
  integrations: 'Integrations',
  settings: 'Settings',
  profile: 'Profile',
  documents: 'Documents',
  notifications: 'Notifications',
  attempts: 'Attempt',
  result: 'Result',
}

const ROOT = {
  admin: { label: 'Dashboard', href: '/admin/dashboard' },
  freelancer: { label: 'Home', href: '/freelancer/dashboard' },
}

function labelFor(segment) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  if (/^\d+$/.test(segment)) return 'Details'
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function AutoBreadcrumb() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  // Nothing useful to show for a bare portal root (e.g. /admin/dashboard).
  const portal = segments[0]
  const root = ROOT[portal]
  if (!root || segments.length <= 2) return null

  const items = [root]
  let href = `/${portal}`
  segments.slice(1).forEach((segment, i) => {
    href += `/${segment}`
    const isLast = i === segments.length - 2
    items.push({ label: labelFor(segment), href: isLast ? undefined : href })
  })

  return (
    <div className="mb-4">
      <Breadcrumb items={items} />
    </div>
  )
}
