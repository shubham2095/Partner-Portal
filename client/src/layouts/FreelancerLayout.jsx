import { Outlet } from 'react-router-dom'
import { BottomNav, Topbar } from '../components/navigation'

const NAV_ITEMS = [
  { to: '/freelancer/dashboard', label: 'Home' },
  { to: '/freelancer/webinars', label: 'Webinars' },
  { to: '/freelancer/tests', label: 'Tests' },
  { to: '/freelancer/certificates', label: 'Certificates' },
  { to: '/freelancer/leads', label: 'Leads' },
  { to: '/freelancer/training', label: 'Learn' },
  { to: '/freelancer/commissions', label: 'Earnings' },
  { to: '/freelancer/profile', label: 'Profile' },
]

export default function FreelancerLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Topbar />
      <main className="flex-1 overflow-y-auto p-4 pb-20 sm:pb-4">
        <Outlet />
      </main>
      <BottomNav items={NAV_ITEMS} />
    </div>
  )
}
