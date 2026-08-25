import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Target,
  Video,
  HelpCircle,
  ClipboardCheck,
  Award,
  GraduationCap,
  TrendingUp,
  Wallet,
  BarChart3,
  Plug,
  Settings,
  CalendarClock,
  ArrowUpRight,
  LifeBuoy,
} from 'lucide-react'
import { Sidebar, Topbar, MobileNavDrawer } from '../components/navigation'
import { PageLoader } from '../components/ui'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { section: 'Operations' },
  { to: '/admin/freelancers', label: 'Freelancers', icon: Users },
  { to: '/admin/leads', label: 'Leads', icon: Target },
  { to: '/admin/follow-ups', label: 'Follow-ups', icon: CalendarClock },
  { section: 'Training' },
  { to: '/admin/webinars', label: 'Webinars', icon: Video },
  { to: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { to: '/admin/tests', label: 'Tests', icon: ClipboardCheck },
  { to: '/admin/certificates', label: 'Certificates', icon: Award },
  { to: '/admin/training', label: 'Training', icon: GraduationCap },
  { section: 'Finance' },
  { to: '/admin/sales', label: 'Sales', icon: TrendingUp },
  { to: '/admin/commissions', label: 'Commissions', icon: Wallet },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
  { section: 'Insights' },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { section: 'Support' },
  { to: '/admin/tickets', label: 'Tickets', icon: LifeBuoy },
  { section: 'System' },
  { to: '/admin/integrations', label: 'Integrations', icon: Plug },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-full bg-background">
      <div className="hidden sm:flex">
        <Sidebar items={NAV_ITEMS} title="Admin Portal" />
      </div>
      <MobileNavDrawer items={NAV_ITEMS} title="Admin Portal" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar showMobileMenuToggle />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
