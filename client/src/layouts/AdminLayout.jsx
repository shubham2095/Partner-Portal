import { Outlet } from 'react-router-dom'
import { Sidebar, Topbar } from '../components/navigation'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/freelancers', label: 'Freelancers' },
  { to: '/admin/webinars', label: 'Webinars' },
  { to: '/admin/questions', label: 'Questions' },
  { to: '/admin/tests', label: 'Tests' },
  { to: '/admin/certificates', label: 'Certificates' },
  { to: '/admin/training', label: 'Training' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/sales', label: 'Sales' },
  { to: '/admin/commissions', label: 'Commissions' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/settings', label: 'Settings' },
]

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar items={NAV_ITEMS} title="Admin Portal" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
