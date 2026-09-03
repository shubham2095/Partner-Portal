import { Suspense, useCallback } from 'react'
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
  User,
} from 'lucide-react'
import { Sidebar, Topbar, MobileNavDrawer, CommandPalette, AutoBreadcrumb } from '../components/navigation'
import { PageLoader } from '../components/ui'
import { useUiStore } from '../store/uiStore'
import { listFreelancers } from '../services/adminFreelancerService'
import { listLeads } from '../services/adminLeadService'

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
  const openCommandPalette = useUiStore((s) => s.openCommandPalette)

  // Live freelancer + lead lookup for the command palette.
  const searchFn = useCallback(async (query) => {
    const [fr, ld] = await Promise.allSettled([
      listFreelancers({ search: query, page: 1, limit: 5 }),
      listLeads({ search: query, page: 1, limit: 5 }),
    ])
    const out = []
    if (fr.status === 'fulfilled') {
      for (const f of fr.value?.data?.freelancers ?? []) {
        out.push({
          id: `f-${f.id}`,
          label: f.full_name,
          sublabel: f.partner_id ?? f.email,
          to: `/admin/freelancers/${f.id}`,
          icon: User,
        })
      }
    }
    if (ld.status === 'fulfilled') {
      for (const l of ld.value?.data?.leads ?? []) {
        out.push({
          id: `l-${l.id}`,
          label: l.client_name || l.lead_number || `Lead #${l.id}`,
          sublabel: l.lead_number ?? l.company ?? '',
          to: `/admin/leads/${l.id}`,
          icon: Target,
        })
      }
    }
    return out
  }, [])

  return (
    <div className="flex h-screen w-full bg-background">
      <div className="hidden sm:flex">
        <Sidebar items={NAV_ITEMS} title="Admin Portal" />
      </div>
      <MobileNavDrawer items={NAV_ITEMS} title="Admin Portal" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar showMobileMenuToggle onOpenSearch={openCommandPalette} />
        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] animate-fade-in p-4 sm:p-6 lg:p-8">
            <AutoBreadcrumb />
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <CommandPalette navItems={NAV_ITEMS} searchFn={searchFn} />
    </div>
  )
}
