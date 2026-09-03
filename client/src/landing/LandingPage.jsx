import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  BadgeCheck,
  Target,
  Handshake,
  Wallet,
  Rocket,
  ArrowRight,
  CalendarClock,
  BarChart3,
  ShieldCheck,
  HandCoins,
  Layers,
} from 'lucide-react'
import Button from '../components/ui/Button'
import HealthCheck from '../components/HealthCheck'

const JOURNEY = [
  { icon: GraduationCap, label: 'Learn' },
  { icon: BadgeCheck, label: 'Get Certified' },
  { icon: Target, label: 'Receive Leads' },
  { icon: Handshake, label: 'Sell' },
  { icon: Wallet, label: 'Earn Commission' },
  { icon: Rocket, label: 'Grow' },
]

const FEATURES = [
  {
    icon: GraduationCap,
    title: 'Training & Certification',
    body: 'Structured courses, a qualification test, and a QR-verifiable certificate once you pass.',
  },
  {
    icon: Target,
    title: 'Real Leads, Assigned to You',
    body: 'Company-sourced leads land in your CRM with a full 13-stage pipeline and activity timeline.',
  },
  {
    icon: CalendarClock,
    title: 'Follow-up Tracking',
    body: 'Overdue, today and upcoming buckets so no client ever slips through the cracks.',
  },
  {
    icon: HandCoins,
    title: 'Transparent Commissions',
    body: 'Configurable rules per service. Every payout is traceable from conversion to bank transfer.',
  },
  {
    icon: ShieldCheck,
    title: 'Fast, Verified Payouts',
    body: 'Request a withdrawal against your payable balance; admin approval and proof on every payment.',
  },
  {
    icon: BarChart3,
    title: 'Performance & Levels',
    body: 'A partner score and tiered levels unlock better lead priority, commission rates and support.',
  },
]

const LEVELS = [
  { name: 'Starter', note: 'Entry access' },
  { name: 'Certified Partner', note: 'Full lead flow' },
  { name: 'Premium Partner', note: 'Priority leads' },
  { name: 'Elite Partner', note: 'Top rates & support' },
]

const TRUST = [
  { icon: Layers, text: '13-stage CRM pipeline' },
  { icon: HandCoins, text: 'Auto-calculated commissions' },
  { icon: BadgeCheck, text: 'QR-verified certificates' },
]

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ---------- Hero ---------- */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-10rem] top-40 h-[26rem] w-[26rem] rounded-full bg-accent/10 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-secondary shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Heltog Partner Network
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              Turn your marketing skills into a{' '}
              <span className="text-gradient-brand">partner income</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
              Learn, get certified, and receive real client leads. Manage them in a full CRM, close
              deals, and earn traceable commission — all in one portal.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth/register">
                <Button size="lg">
                  Become a Partner
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button size="lg" variant="secondary">
                  Partner Login
                </Button>
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {TRUST.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
                  {text}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Stylised app preview */}
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-elevated ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <p className="text-caption">Commission earned</p>
                <span className="rounded-full bg-success-bg px-2 py-0.5 text-[0.6875rem] font-semibold text-success">
                  +18% MoM
                </span>
              </div>
              <p className="mt-1 font-display text-3xl font-bold tracking-tight">₹1,84,200</p>

              <div className="mt-5 flex items-end gap-2">
                {[38, 52, 44, 68, 58, 82, 74].map((h, i) => (
                  <div key={i} className="flex-1">
                    <div
                      className="rounded-md bg-gradient-to-t from-primary/40 to-primary"
                      style={{ height: `${h}px` }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2.5">
                {[
                  { k: 'Active leads', v: '24' },
                  { k: 'Converted this month', v: '9' },
                  { k: 'Payable balance', v: '₹42,500' },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface-muted/50 px-3 py-2 text-sm"
                  >
                    <span className="text-text-secondary">{row.k}</span>
                    <span className="font-semibold text-text-primary">{row.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-border bg-surface px-4 py-3 shadow-card sm:block">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-bg text-accent-hover">
                  <BadgeCheck className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-text-primary">Certificate issued</p>
                  <p className="text-[0.6875rem] text-text-muted">HTG-FR-000128</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Journey ---------- */}
      <section className="border-y border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-center text-caption">The partner journey</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {JOURNEY.map(({ icon: Icon, label }, i) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary ring-1 ring-inset ring-primary-100">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="text-sm font-medium text-text-primary">{label}</span>
                <span className="text-[0.6875rem] font-semibold text-text-muted">Step {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Everything you need to sell and get paid</h2>
          <p className="mt-3 text-text-secondary">
            The portal covers the whole loop — from your first lesson to a verified payout.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-surface p-5 shadow-card card-interactive"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary ring-1 ring-inset ring-primary-100">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-text-primary">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Levels ---------- */}
      <section className="border-t border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Grow through partner levels</h2>
            <p className="mx-auto max-w-xl text-text-secondary">
              Consistent performance moves you up. Higher tiers unlock lead priority, better rates and
              dedicated support.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEVELS.map((lvl, i) => (
              <div
                key={lvl.name}
                className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-card"
              >
                <span
                  className="absolute right-4 top-4 font-display text-3xl font-extrabold text-primary/10"
                  aria-hidden
                >
                  0{i + 1}
                </span>
                <p className="text-sm font-semibold text-text-primary">{lvl.name}</p>
                <p className="mt-1 text-xs text-text-muted">{lvl.note}</p>
                <div className="mt-4 h-1.5 rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-400"
                    style={{ width: `${25 * (i + 1)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-brand px-8 py-14 text-center shadow-elevated">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/20 blur-2xl" />
          <h2 className="relative text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to start earning as a partner?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-white/80 sm:text-base">
            Create your account, complete your profile, and take the qualification test.
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/auth/register">
              <Button size="lg" className="!bg-white !text-primary-700 shadow-sm hover:!bg-white/90">
                Become a Partner
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="ghost" className="!text-white ring-1 ring-inset ring-white/40 hover:!bg-white/15">
                Partner Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <img src="/heltog-logo.webp" alt="Heltog Technologies" className="h-6 w-auto" />
            <span className="text-xs text-text-muted">© {new Date().getFullYear()} Heltog Technologies Pvt Ltd</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-text-secondary">
            <Link to="/auth/login" className="hover:text-primary">
              Login
            </Link>
            <Link to="/auth/register" className="hover:text-primary">
              Register
            </Link>
            <Link to="/verify" className="hover:text-primary">
              Verify a certificate
            </Link>
          </div>
          <HealthCheck />
        </div>
      </footer>
    </div>
  )
}
