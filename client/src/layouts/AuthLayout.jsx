import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { GraduationCap, Target, HandCoins, TrendingUp, CheckCircle2, Award, ShieldCheck } from 'lucide-react'
import { PageLoader } from '../components/ui'

const BENEFITS = [
  { icon: GraduationCap, text: 'Free training + a QR-verifiable certificate' },
  { icon: Target, text: 'Real client leads, straight into your CRM' },
  { icon: HandCoins, text: 'Transparent, auto-calculated commission' },
  { icon: TrendingUp, text: 'Grow through partner levels and better rates' },
]

// Faint dot-grid texture for the brand panel — inline so there's no asset.
const DOT_GRID =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='2' cy='2' r='1' fill='rgba(255,255,255,0.07)'/%3E%3C/svg%3E\")"

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.02fr_1fr]">
      {/* ================= Brand panel (desktop only) ================= */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14">
        {/* layered background */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(155deg,#2e1065 0%,#4c1d95 42%,#1e1b4b 100%)' }}
        />
        <div className="absolute inset-0" style={{ backgroundImage: DOT_GRID }} />
        <div aria-hidden className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-400/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
        <div aria-hidden className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />

        {/* logo */}
        <div className="relative">
          <span className="inline-flex rounded-xl bg-white px-3 py-2 shadow-lg shadow-black/20">
            <img src="/heltog-logo.webp" alt="Heltog Technologies" className="h-7 w-auto" />
          </span>
        </div>

        {/* headline + benefits */}
        <div className="relative max-w-md">
          <h2 className="font-display text-[2.1rem] font-extrabold leading-[1.12] tracking-tight text-white xl:text-4xl">
            Where marketing skills
            <br />
            become <span className="bg-gradient-to-r from-white to-accent-400 bg-clip-text text-transparent">income</span>.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Learn, get certified, receive real client leads, close deals, and get paid — the whole
            partner workflow in one portal.
          </p>

          <ul className="mt-8 space-y-3.5">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/15">
                  <Icon className="h-4 w-4 text-white" strokeWidth={2} />
                </span>
                <span className="text-sm text-white/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* floating card collage */}
        <div className="relative h-52">
          {/* main card */}
          <div className="absolute bottom-0 left-0 w-72 rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/30 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.09em] text-white/60">
                Commission earned
              </p>
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[0.625rem] font-semibold text-emerald-300">
                +18%
              </span>
            </div>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight text-white">₹1,84,200</p>
            <div className="mt-3 flex items-end gap-1.5">
              {[34, 48, 40, 62, 52, 78, 68].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-white/30 to-white/80" style={{ height: `${h * 0.45}px` }} />
              ))}
            </div>
          </div>

          {/* payout toast */}
          <div className="absolute right-2 top-2 flex w-56 rotate-3 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.09] px-3 py-2.5 shadow-xl shadow-black/25 backdrop-blur-md">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">Payout approved</p>
              <p className="text-[0.625rem] text-white/60">₹42,500 · UPI</p>
            </div>
          </div>

          {/* certificate chip */}
          <div className="absolute bottom-4 right-6 flex -rotate-2 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.09] px-3 py-2 shadow-xl shadow-black/25 backdrop-blur-md">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/25 text-accent-400">
              <Award className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-xs font-semibold text-white">Certificate issued</p>
              <p className="text-[0.625rem] text-white/60">HTG-FR-000128</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= Form panel ================= */}
      <main className="relative flex items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <img src="/heltog-logo.webp" alt="Heltog Technologies" className="h-9 w-auto" />
          </div>

          <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated ring-1 ring-black/[0.04]">
            {/* thin brand accent strip */}
            <div className="h-1 bg-gradient-to-r from-primary via-fuchsia-500 to-accent" />
            <div className="p-8 sm:p-10">
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>

              <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-border pt-5 text-xs text-text-muted">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                Encrypted connection · your data stays private
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
