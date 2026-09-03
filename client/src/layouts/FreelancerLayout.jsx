import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Home, Video, ClipboardCheck, Award, Target, GraduationCap, Wallet, Bell, User, CalendarClock, LifeBuoy } from 'lucide-react'
import { BottomNav, Sidebar, Topbar, CommandPalette, AutoBreadcrumb } from '../components/navigation'
import { PageLoader } from '../components/ui'
import { useUiStore } from '../store/uiStore'

const NAV_ITEMS = [
  { to: '/freelancer/dashboard', label: 'Home', icon: Home },
  { to: '/freelancer/webinars', label: 'Webinars', icon: Video },
  { to: '/freelancer/tests', label: 'Tests', icon: ClipboardCheck },
  { to: '/freelancer/certificates', label: 'Certificates', icon: Award },
  { to: '/freelancer/leads', label: 'Leads', icon: Target },
  { to: '/freelancer/follow-ups', label: 'Follow-ups', icon: CalendarClock },
  { to: '/freelancer/training', label: 'Learn', icon: GraduationCap },
  { to: '/freelancer/commissions', label: 'Earnings', icon: Wallet },
  { to: '/freelancer/tickets', label: 'Support', icon: LifeBuoy },
  { to: '/freelancer/notifications', label: 'Notifications', icon: Bell },
  { to: '/freelancer/profile', label: 'Profile', icon: User },
]

// BottomNav is a compact 5-item strip on mobile — the full list would be
// cramped, so it shows the everyday-use items only. Everything is still
// reachable via the desktop Sidebar (all 9 items) and, for the rest, via
// in-page navigation (e.g. Profile links out to Documents).
const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ['/freelancer/dashboard', '/freelancer/leads', '/freelancer/training', '/freelancer/commissions', '/freelancer/profile'].includes(
    item.to
  )
)

export default function FreelancerLayout() {
  const openCommandPalette = useUiStore((s) => s.openCommandPalette)

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden sm:flex">
        <Sidebar items={NAV_ITEMS} title="Freelancer Portal" />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onOpenSearch={openCommandPalette} />
        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl animate-fade-in p-4 pb-24 sm:p-6 sm:pb-8 lg:max-w-5xl">
            <AutoBreadcrumb />
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <BottomNav items={BOTTOM_NAV_ITEMS} />
      <CommandPalette navItems={NAV_ITEMS} />
    </div>
  )
}
